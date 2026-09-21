import type {
  CodeGraph,
  GraphNode
} from "../code-parser/code-graph.js";

export function findDefinitions(
  graph: CodeGraph,
  name: string
): GraphNode[] {
  const normalized =
    name.toLowerCase();

  return graph.nodes.filter(
    (node) =>
      node.name.toLowerCase() ===
      normalized
  );
}

export function findDefinitionsContaining(
  graph: CodeGraph,
  query: string
): GraphNode[] {
  const normalized =
    query.toLowerCase();

  return graph.nodes.filter(
    (node) =>
      node.name
        .toLowerCase()
        .includes(normalized)
  );
}