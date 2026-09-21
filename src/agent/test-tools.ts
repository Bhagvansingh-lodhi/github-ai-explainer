import {
  parseRepository
} from "../code-parser/repository-parser.js";

import {
  buildCodeGraph
} from "../code-parser/code-graph.js";

import {
  buildSymbolIndex
} from "../code-parser/symbol-index.js";

import {
  createRepositoryTools
} from "./tools/index.js";

const repositoryPath =
  "./tmp/eda09494-1c1d-4e2e-9444-a7ffba542a3c/expressjs-express";

const repositoryName =
  "expressjs-express";

const parsedFiles =
  await parseRepository(
    repositoryPath
  );

const graph =
  buildCodeGraph(
    parsedFiles
  );

const index =
  buildSymbolIndex(
    graph
  );

const tools =
  createRepositoryTools(
    repositoryPath,
    repositoryName,
    graph,
    index
  );

console.log(
  tools.map(
    (tool) => tool.name
  )
);