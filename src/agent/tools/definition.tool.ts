import { z } from "zod";
import { tool } from "@langchain/core/tools";

import {
  findDefinitions
} from "../../code-search/symbol-search.js";

import type {
  CodeGraph
} from "../../code-parser/code-graph.js";

export function createDefinitionTool(
  graph: CodeGraph
) {
  return tool(
    async ({ name }) => {
      const definitions =
        findDefinitions(
          graph,
          name
        );

      if (
        definitions.length === 0
      ) {
        return `No definition found for "${name}".`;
      }

      return JSON.stringify(
        definitions,
        null,
        2
      );
    },
    {
      name: "find_definition",
      description:
        "Find where a function, class, or variable is defined in the repository.",
      schema: z.object({
        name: z
          .string()
          .describe(
            "Name of the symbol to find"
          )
      })
    }
  );
}