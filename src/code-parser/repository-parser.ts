import fs from "node:fs/promises";
import path from "node:path";

import {
  parseJavaScript,
  type ParsedFile
} from "./parser.js";

export interface ParsedRepositoryFile {
  path: string;
  parsed: ParsedFile;
}

const IGNORED_DIRECTORIES = new Set([
  "node_modules",
  ".git",
  ".next",
  "dist",
  "build",
  "coverage"
]);

export async function parseRepository(
  rootDirectory: string
): Promise<ParsedRepositoryFile[]> {
  const results: ParsedRepositoryFile[] = [];

  async function walk(
    directory: string
  ): Promise<void> {
    const entries = await fs.readdir(
      directory,
      {
        withFileTypes: true
      }
    );

    for (const entry of entries) {
      if (
        entry.isDirectory() &&
        IGNORED_DIRECTORIES.has(entry.name)
      ) {
        continue;
      }

      const fullPath = path.join(
        directory,
        entry.name
      );

      if (entry.isDirectory()) {
        await walk(fullPath);
        continue;
      }

      if (!entry.isFile()) {
        continue;
      }
const supportedExtensions = new Set([
  ".js",
  ".jsx",
  ".mjs",
  ".cjs"
]);

if (!supportedExtensions.has(
  path.extname(entry.name)
)) {
  continue;
}
      try {
        const source = await fs.readFile(
          fullPath,
          "utf-8"
        );

        const parsed =
          parseJavaScript(source);

        results.push({
          path: path.relative(
            rootDirectory,
            fullPath
          ),
          parsed
        });
      } catch (error) {
        console.error(
          `Failed to parse ${fullPath}`,
          error
        );
      }
    }
  }

  await walk(rootDirectory);

  return results;
}