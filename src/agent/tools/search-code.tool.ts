import { z } from "zod";
import { tool } from "@langchain/core/tools";

import { searchCode } from "../../code-search/code-search.js";

export function createSearchCodeTool(
  repositoryPath: string
) {
  return tool(
    async ({
      query,
      maxResults
    }) => {
      const results =
        await searchCode(
          repositoryPath,
          query,
          maxResults
        );

      if (results.length === 0) {
        return "No matching code found.";
      }

      return JSON.stringify(
        results,
        null,
        2
      );
    },
    {
      name: "search_code",
      description:
        "Search the repository for code, text, filenames, configuration, documentation, or keywords. Use this when you need to locate relevant code.",
      schema: z.object({
        query: z
          .string()
          .describe(
            "Text or keyword to search for"
          ),

        maxResults: z
          .number()
          .int()
          .min(1)
          .max(100)
          .default(20)
          .describe(
            "Maximum number of results"
          )
      })
    }
  );
}