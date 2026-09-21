import { z } from "zod";
import { tool } from "@langchain/core/tools";

import type {
  CodeGraph
} from "../../code-parser/code-graph.js";


export function createTraceFunctionTool(
  graph: CodeGraph
) {
  return tool(
    async ({ name, maxDepth }) => {
      const depth =
        maxDepth ?? 5;

      const startNodes =
        graph.nodes.filter(
          node =>
            node.name.toLowerCase() ===
            name.toLowerCase()
        );

      if (startNodes.length === 0) {
        return `No function or symbol found for "${name}".`;
      }

      const results: string[] = [];

      for (const startNode of startNodes) {
        results.push(
          `START: ${startNode.name}`
        );

        results.push(
          `File: ${startNode.file}:${startNode.startLine}`
        );

        const visited =
          new Set<string>();

        function trace(
          nodeId: string,
          currentDepth: number,
          prefix: string
        ) {
          if (
            currentDepth >= depth
          ) {
            return;
          }

          if (
            visited.has(nodeId)
          ) {
            return;
          }

          visited.add(nodeId);

          const outgoingEdges =
            graph.edges.filter(
              edge =>
                edge.from === nodeId &&
                edge.type === "calls"
            );

          for (const edge of outgoingEdges) {
            const target =
              graph.nodes.find(
                node =>
                  node.id === edge.to
              );

            if (!target) {
              continue;
            }

            results.push(
              `${prefix}→ ${target.name} ` +
              `(${target.file}:${target.startLine})`
            );

            trace(
              target.id,
              currentDepth + 1,
              `${prefix}  `
            );
          }
        }

        trace(
          startNode.id,
          0,
          ""
        );

        results.push("");
      }

      return results.join("\n");
    },
    {
      name: "trace_function",

      description:
        "Trace the call flow starting from a function or symbol. Shows which functions it calls recursively, including file paths and line numbers. Use this when the user asks how a function works internally or what functions are called after it.",

      schema: z.object({
        name: z
          .string()
          .describe(
            "Function or symbol name to trace"
          ),

        maxDepth: z
          .number()
          .int()
          .min(1)
          .max(10)
          .optional()
          .default(5)
          .describe(
            "Maximum call depth to trace"
          )
      })
    }
  );
}