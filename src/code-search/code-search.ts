import fs from "node:fs/promises";
import path from "node:path";

export interface SearchResult {
  file: string;
  line: number;
  content: string;
}

const IGNORED_DIRECTORIES =
  new Set([
    "node_modules",
    ".git",
    ".next",
    "dist",
    "build",
    "coverage",
    "vendor"
  ]);

const SUPPORTED_EXTENSIONS =
  new Set([
    ".js",
    ".jsx",
    ".mjs",
    ".cjs",
    ".ts",
    ".tsx",
    ".json",
    ".md",
    ".css",
    ".scss",
    ".html",
    ".sql"
  ]);

function shouldIgnore(
  filePath: string
): boolean {
  const parts =
    filePath.split(path.sep);

  return parts.some((part) =>
    IGNORED_DIRECTORIES.has(part)
  );
}

export async function searchCode(
  rootDirectory: string,
  query: string,
  maxResults = 50
): Promise<SearchResult[]> {
  const results: SearchResult[] = [];

  const normalizedQuery =
    query.toLowerCase();

  async function walk(
    directory: string
  ): Promise<void> {
    if (results.length >= maxResults) {
      return;
    }

    const entries =
      await fs.readdir(
        directory,
        {
          withFileTypes: true
        }
      );

    for (const entry of entries) {
      if (results.length >= maxResults) {
        return;
      }

      const fullPath =
        path.join(
          directory,
          entry.name
        );

      if (
        shouldIgnore(fullPath)
      ) {
        continue;
      }

      if (entry.isDirectory()) {
        await walk(fullPath);
        continue;
      }

      if (!entry.isFile()) {
        continue;
      }

      const extension =
        path.extname(entry.name)
          .toLowerCase();

      if (
        !SUPPORTED_EXTENSIONS.has(
          extension
        )
      ) {
        continue;
      }

      try {
        const source =
          await fs.readFile(
            fullPath,
            "utf-8"
          );

        const lines =
          source.split(/\r?\n/);

        for (
          let i = 0;
          i < lines.length;
          i++
        ) {
          if (
            lines[i]
              .toLowerCase()
              .includes(normalizedQuery)
          ) {
            results.push({
              file: path
                .relative(
                  rootDirectory,
                  fullPath
                )
                .split(path.sep)
                .join("/"),
              line: i + 1,
              content:
                lines[i].trim()
            });
          }

          if (
            results.length >=
            maxResults
          ) {
            break;
          }
        }
      } catch (error) {
        console.error(
          `Failed to search ${fullPath}`,
          error
        );
      }
    }
  }

  await walk(rootDirectory);

  return results;
}