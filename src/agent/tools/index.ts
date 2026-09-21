import {
  createSearchCodeTool
} from "./search-code.tool.js";

import {
  createDefinitionTool
} from "./definition.tool.js";

import {
  createFileTool
} from "./file.tool.js";

import {
  createReferencesTool
} from "./references.tool.js";

import {
  createStructureTool
} from "./structure.tool.js";

import {
  createDependenciesTool
} from "./dependencies.tool.js";

import {
  createProjectSummaryTool
} from "./project-summary.tool.js";

import type {
  CodeGraph
} from "../../code-parser/code-graph.js";

import type {
  SymbolIndex
} from "../../code-parser/symbol-index.js";


export function createRepositoryTools(
  repositoryPath: string,
  repositoryName: string,
  graph: CodeGraph,
  index: SymbolIndex
) {
  return [
    createSearchCodeTool(
      repositoryPath
    ),

    createDefinitionTool(
      graph
    ),

    createReferencesTool(
      index
    ),

    createFileTool(
      repositoryPath
    ),

    createStructureTool(
      repositoryPath
    ),

    createDependenciesTool(
      repositoryPath
    ),

    createProjectSummaryTool(
      repositoryPath,
      repositoryName
    )
  ];
}