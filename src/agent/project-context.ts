import fs from "node:fs/promises";
import path from "node:path";

import type {
  ProjectAnalysis
} from "../analyzer/project.analyzer.js";

import type {
  TechStack
} from "../analyzer/stack.detector.js";

import type {
  ImportantFiles
} from "../analyzer/important-files.js";

export interface ProjectContext {
  repositoryName: string;
  languages: string[];
  frameworks: string[];
  libraries: string[];
  databases: string[];
  totalFiles: number;
  importantFiles: ImportantFiles;
  packageJson?: ProjectAnalysis["packageJson"];
  structure: string[];
}

const IGNORED =
  new Set([
    "node_modules",
    ".git",
    ".next",
    "dist",
    "build",
    "coverage"
  ]);

export async function buildProjectContext(
  repositoryPath: string,
  repositoryName: string,
  analysis: ProjectAnalysis,
  techStack: TechStack,
  importantFiles: ImportantFiles
): Promise<ProjectContext> {
  const structure: string[] = [];

  async function walk(
    directory: string,
    depth: number
  ): Promise<void> {
    if (depth > 3) {
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
      a.name.localeCompare(b.name)
    );

    for (const entry of entries) {
      if (
        IGNORED.has(entry.name)
      ) {
        continue;
      }

      const fullPath =
        path.join(
          directory,
          entry.name
        );

      const relativePath =
        path
          .relative(
            repositoryPath,
            fullPath
          )
          .split(path.sep)
          .join("/");

      structure.push(
        `${"  ".repeat(depth)}${relativePath}${
          entry.isDirectory() ? "/" : ""
        }`
      );

      if (entry.isDirectory()) {
        await walk(
          fullPath,
          depth + 1
        );
      }
    }
  }

  await walk(
    repositoryPath,
    0
  );

  return {
    repositoryName,
    languages:
      techStack.languages,
    frameworks:
      techStack.frameworks,
    libraries:
      techStack.libraries,
    databases:
      techStack.databases,
    totalFiles:
      analysis.totalFiles,
    importantFiles,
    packageJson:
      analysis.packageJson,
    structure
  };
}
export function formatProjectContext(
  context: ProjectContext
): string {
  return `
PROJECT CONTEXT

Repository:
${context.repositoryName}

Total files:
${context.totalFiles}

Languages:
${
  context.languages.length > 0
    ? context.languages.join(", ")
    : "Unknown"
}

Frameworks:
${
  context.frameworks.length > 0
    ? context.frameworks.join(", ")
    : "None detected"
}

Libraries:
${
  context.libraries.length > 0
    ? context.libraries.join(", ")
    : "None detected"
}

Databases:
${
  context.databases.length > 0
    ? context.databases.join(", ")
    : "None detected"
}

Entry points:
${
  context.importantFiles.entryPoints.join(
    ", "
  ) || "None detected"
}

Documentation:
${
  context.importantFiles.documentation.join(
    ", "
  ) || "None detected"
}

Source directories:
${
  context.importantFiles.sourceDirectories.join(
    ", "
  ) || "None detected"
}

Test directories:
${
  context.importantFiles.testDirectories.join(
    ", "
  ) || "None detected"
}

Database files:
${
  context.importantFiles.databaseFiles.join(
    ", "
  ) || "None detected"
}

Project structure:

${context.structure.join("\n")}
`;
}