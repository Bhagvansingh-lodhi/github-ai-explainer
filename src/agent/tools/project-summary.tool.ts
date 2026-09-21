import { z } from "zod";
import { tool } from "@langchain/core/tools";

import {
  analyzeProject
} from "../../analyzer/project.analyzer.js";

import {
  detectTechStack
} from "../../analyzer/stack.detector.js";

import {
  detectImportantFiles
} from "../../analyzer/important-files.js";

import {
  buildProjectContext,
  formatProjectContext
} from "../project-context.js";

export function createProjectSummaryTool(
  repositoryPath: string,
  repositoryName: string
) {
  return tool(
    async () => {
      const analysis =
        await analyzeProject(
          repositoryPath
        );

      const techStack =
        detectTechStack(
          analysis
        );

      const importantFiles =
        await detectImportantFiles(
          repositoryPath
        );

      const projectContext =
        await buildProjectContext(
          repositoryPath,
          repositoryName,
          analysis,
          techStack,
          importantFiles
        );

      return formatProjectContext(
        projectContext
      );
    },
    {
      name: "get_project_summary",

      description:
        "Get a high-level summary of the repository including its purpose-related metadata, languages, frameworks, libraries, databases, entry points, important files, source directories, tests, database files, and project structure. Use this when the user asks to explain or summarize the entire project.",

      schema: z.object({})
    }
  );
}