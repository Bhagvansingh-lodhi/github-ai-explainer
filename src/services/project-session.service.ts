import type { ProjectAnalysis } from "../analyzer/project.analyzer.js";
import type { TechStack } from "../analyzer/stack.detector.js";
import type { ImportantFiles } from "../analyzer/important-files.js";

import type { ParsedRepositoryFile } from "../code-parser/repository-parser.js";
import type { CodeGraph } from "../code-parser/code-graph.js";
import type { SymbolIndex } from "../code-parser/symbol-index.js";
import type { ProjectContext } from "../agent/project-context.js";

export interface ProjectSession {
  projectId: string;

  repositoryPath: string;
  repositoryName: string;

  parsedFiles: ParsedRepositoryFile[];

  codeGraph: CodeGraph;
  symbolIndex: SymbolIndex;

  analysis: ProjectAnalysis;
  techStack: TechStack;
  importantFiles: ImportantFiles;

  projectContext: ProjectContext;

  createdAt: number;
}

const sessions =
  new Map<string, ProjectSession>();

export function saveProjectSession(
  session: ProjectSession
) {
  sessions.set(
    session.projectId,
    session
  );
}

export function getProjectSession(
  projectId: string
): ProjectSession | undefined {
  return sessions.get(projectId);
}

export function deleteProjectSession(
  projectId: string
): boolean {
  return sessions.delete(
    projectId
  );
}

export function hasProjectSession(
  projectId: string
): boolean {
  return sessions.has(
    projectId
  );
}