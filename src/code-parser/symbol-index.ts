import type {
  CodeGraph,
  GraphNode
} from "./code-graph.js";

export interface SymbolReference {
  file: string;
  line: number;
  type: "definition" | "call";
  symbol: string;
}

export interface SymbolIndex {
  definitions: Map<string, GraphNode[]>;
  references: Map<string, SymbolReference[]>;
}

export function buildSymbolIndex(
  graph: CodeGraph
): SymbolIndex {
  const definitions =
    new Map<string, GraphNode[]>();

  const references =
    new Map<string, SymbolReference[]>();

  // -----------------------------
  // Definitions
  // -----------------------------

  for (const node of graph.nodes) {
    const existing =
      definitions.get(node.name) ?? [];

    existing.push(node);

    definitions.set(
      node.name,
      existing
    );
  }

  // -----------------------------
  // References
  // -----------------------------

  for (const edge of graph.edges) {
    if (edge.type !== "calls") {
      continue;
    }

    const targetNode =
      graph.nodes.find(
        (node) => node.id === edge.to
      );

    if (!targetNode) {
      continue;
    }

    const callerNode =
      graph.nodes.find(
        (node) => node.id === edge.from
      );

    if (!callerNode) {
      continue;
    }

    const existing =
      references.get(targetNode.name) ?? [];

    existing.push({
      file: callerNode.file,
      line: callerNode.startLine,
      type: "call",
      symbol: callerNode.name
    });

    references.set(
      targetNode.name,
      existing
    );
  }

  return {
    definitions,
    references
  };
} export function findDefinition(
  index: SymbolIndex,
  symbolName: string
): GraphNode[] {
  return (
    index.definitions.get(symbolName) ?? []
  );
}

export function findReferences(
  index: SymbolIndex,
  symbolName: string
): SymbolReference[] {
  return (
    index.references.get(symbolName) ?? []
  );
}