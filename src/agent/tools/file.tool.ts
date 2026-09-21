import fs from "node:fs/promises";
import path from "node:path";

import { z } from "zod";
import { tool } from "@langchain/core/tools";

export function createFileTool(
  repositoryPath: string
) {
  return tool(
    async ({
      file,
      startLine,
      endLine
    }) => {
      const fullPath =
        path.resolve(
          repositoryPath,
          file
        );

      const repositoryRoot =
        path.resolve(
          repositoryPath
        );

      // Security check:
      // prevent reading outside repository.
      if (
        fullPath !== repositoryRoot &&
        !fullPath.startsWith(
          repositoryRoot +
            path.sep
        )
      ) {
        return "Invalid file path.";
      }

      try {
        const source =
          await fs.readFile(
            fullPath,
            "utf-8"
          );

        const lines =
          source.split(/\r?\n/);

        const start =
          Math.max(
            1,
            startLine ?? 1
          );

        const end =
          Math.min(
            lines.length,
            endLine ?? lines.length
          );

        const selected =
          lines
            .slice(start - 1, end)
            .map(
              (line, index) =>
                `${start + index}: ${line}`
            )
            .join("\n");

        return selected;
      } catch {
        return `Unable to read file: ${file}`;
      }
    },
    {
      name: "read_file",
      description:
        "Read source code from a repository file. Use line ranges when possible to avoid reading unnecessarily large files.",
      schema: z.object({
        file: z
          .string()
          .describe(
            "Repository-relative file path"
          ),

        startLine: z
          .number()
          .int()
          .min(1)
          .optional()
          .describe(
            "First line to read"
          ),

        endLine: z
          .number()
          .int()
          .min(1)
          .optional()
          .describe(
            "Last line to read"
          )
      })
    }
  );
}