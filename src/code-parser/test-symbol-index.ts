import { parseRepository } from "./repository-parser.js";
import { buildCodeGraph } from "./code-graph.js";

import {
  buildSymbolIndex,
  findDefinition,
  findReferences
} from "./symbol-index.js";

const repositoryPath =
  "./tmp/eda09494-1c1d-4e2e-9444-a7ffba542a3c/expressjs-express";

const parsedFiles =
  await parseRepository(repositoryPath);

const graph =
  buildCodeGraph(parsedFiles);

const index =
  buildSymbolIndex(graph);

const symbol = "app";

console.log("\nDEFINITIONS:");

console.log(
  JSON.stringify(
    findDefinition(index, symbol),
    null,
    2
  )
);

console.log("\nREFERENCES:");

console.log(
  JSON.stringify(
    findReferences(index, symbol),
    null,
    2
  )
);