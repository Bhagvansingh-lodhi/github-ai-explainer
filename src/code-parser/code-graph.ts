import path from "node:path";

import {
  resolveImports
} from "./import-resolver.js";

import type {
  ParsedRepositoryFile
} from "./repository-parser.js";

export interface GraphNode {
  id: string;
  name: string;
  type: string;
  file: string;
  startLine: number;
  endLine: number;
}

export interface GraphEdge {
  from: string;
  to: string;
  type: "calls" | "imports";
}

export interface CodeGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

function normalizeFilePath(
  filePath: string
): string {
  return filePath
    .split(path.sep)
    .join("/");
}

export function buildCodeGraph(
  files: ParsedRepositoryFile[]
): CodeGraph {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];

  // --------------------------------
  // 1. Create symbol nodes
  // --------------------------------

  for (const file of files) {
    const normalizedFile =
      normalizeFilePath(file.path);

    const symbols = [
      ...file.parsed.functions,
      ...file.parsed.classes,
      ...file.parsed.variables
    ];

    for (const symbol of symbols) {
      const id =
        `${normalizedFile}:${symbol.name}`;

      nodes.push({
        id,
        name: symbol.name,
        type: symbol.type,
        file: normalizedFile,
        startLine: symbol.startLine,
        endLine: symbol.endLine
      });
    }
  }

  // --------------------------------
  // 2. Resolve imports
  // --------------------------------

  const resolvedImports =
    resolveImports(files);

  for (const importInfo of resolvedImports) {
    edges.push({
      from: normalizeFilePath(
        importInfo.fromFile
      ),
      to: normalizeFilePath(
        importInfo.toFile
      ),
      type: "imports"
    });
  }

  // --------------------------------
  // 3. Create function-call edges
  // --------------------------------

  for (const file of files) {
    const currentFile =
      normalizeFilePath(file.path);

    for (const call of file.parsed.calls) {
      // Find the function/class/variable
      // containing the call.
      const callerNode =
        nodes.find(
          (node) =>
            node.file === currentFile &&
            node.name === call.caller
        );

      if (!callerNode) {
        continue;
      }

      // Find possible function definitions.
      const possibleCallees =
        nodes.filter(
          (node) =>
            node.name === call.callee &&
            node.type === "function"
        );

      for (const calleeNode of possibleCallees) {
        // Don't create a self-edge unless
        // the function is actually recursive.
        if (
          callerNode.id === calleeNode.id &&
          callerNode.name !== call.callee
        ) {
          continue;
        }

        edges.push({
          from: callerNode.id,
          to: calleeNode.id,
          type: "calls"
        });
      }
    }
  }

  // --------------------------------
  // 4. Remove duplicate edges
  // --------------------------------

  const uniqueEdges = Array.from(
    new Map(
      edges.map((edge) => [
        `${edge.from}|${edge.to}|${edge.type}`,
        edge
      ])
    ).values()
  );

  return {
    nodes,
    edges: uniqueEdges
  };
}