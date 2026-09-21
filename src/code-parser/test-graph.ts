import { parseRepository } from "./repository-parser.js";
import { buildCodeGraph } from "./code-graph.js";

const repositoryPath =
  "./tmp/eda09494-1c1d-4e2e-9444-a7ffba542a3c/expressjs-express";

const parsedFiles =
  await parseRepository(repositoryPath);

const graph =
  buildCodeGraph(parsedFiles);

console.log(
  JSON.stringify(graph, null, 2)
);