import { z } from "zod";
import { tool } from "@langchain/core/tools";

import {
  findReferences
} from "../../code-search/reference-search.js";

import type {
  SymbolIndex
} from "../../code-parser/symbol-index.js";

export function createReferencesTool(
  index: SymbolIndex
) {
  return tool(
    async ({ name }) => {
      const references =
        findReferences(
          index,
          name
        );

      if (
        references.length === 0
      ) {
        return `No references found for "${name}".`;
      }

      return JSON.stringify(
        references,
        null,
        2
      );
    },
    {
      name: "find_references",
      description:
        "Find places in the repository where a function or symbol is referenced or called.",
      schema: z.object({
        name: z
          .string()
          .describe(
            "Symbol name to search references for"
          )
      })
    }
  );
}