import fs from "node:fs/promises";
import path from "node:path";

import { z } from "zod";
import { tool } from "@langchain/core/tools";

interface PackageJson {
  name?: string;
  version?: string;
  dependencies?: Record<
    string,
    string
  >;
  devDependencies?: Record<
    string,
    string
  >;
  scripts?: Record<
    string,
    string
  >;
}

export function createDependenciesTool(
  repositoryPath: string
) {
  return tool(
    async () => {
      const packagePath =
        path.join(
          repositoryPath,
          "package.json"
        );

      try {
        const content =
          await fs.readFile(
            packagePath,
            "utf-8"
          );

        const packageJson =
          JSON.parse(
            content
          ) as PackageJson;

        return JSON.stringify(
          {
            name:
              packageJson.name,
            version:
              packageJson.version,
            dependencies:
              packageJson.dependencies ??
              {},
            devDependencies:
              packageJson.devDependencies ??
              {},
            scripts:
              packageJson.scripts ??
              {}
          },
          null,
          2
        );
      } catch {
        return "No package.json found in repository.";
      }
    },
    {
      name: "get_dependencies",
      description:
        "Get the project's npm dependencies, development dependencies, and scripts from package.json.",
      schema: z.object({})
    }
  );
}