import fs from "node:fs/promises";
import path from "node:path";

import { z } from "zod";
import { tool } from "@langchain/core/tools";

const IGNORED =
  new Set([
    "node_modules",
    ".git",
    ".next",
    "dist",
    "build",
    "coverage"
  ]);

export function createStructureTool(
  repositoryPath: string
) {
  return tool(
    async ({ maxDepth }) => {
      const lines: string[] = [];

      async function walk(
        directory: string,
        depth: number
      ): Promise<void> {
        if (depth > maxDepth) {
          return;
        }

        const entries =
          await fs.readdir(
            directory,
            {
              withFileTypes: true
            }
          );

        entries.sort((a, b) =>
          a.name.localeCompare(
            b.name
          )
        );

        for (const entry of entries) {
          if (
            IGNORED.has(entry.name)
          ) {
            continue;
          }

          const relativePath =
            path.relative(
              repositoryPath,
              path.join(
                directory,
                entry.name
              )
            );

          const prefix =
            "  ".repeat(depth);

          if (entry.isDirectory()) {
            lines.push(
              `${prefix}${relativePath}/`
            );

            await walk(
              path.join(
                directory,
                entry.name
              ),
              depth + 1
            );
          } else {
            lines.push(
              `${prefix}${relativePath}`
            );
          }
        }
      }

      await walk(
        repositoryPath,
        0
      );

      return lines.join("\n");
    },
    {
      name: "get_project_structure",
      description:
        "Get the repository folder and file structure. Use this to understand how the project is organized.",
      schema: z.object({
        maxDepth: z
          .number()
          .int()
          .min(1)
          .max(8)
          .default(3)
      })
    }
  );
}