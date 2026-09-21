import { parseRepository } from "./repository-parser.js";

const repositoryPath =
  "./tmp/eda09494-1c1d-4e2e-9444-a7ffba542a3c/expressjs-express";

const result =
  await parseRepository(repositoryPath);

console.log(
  JSON.stringify(result, null, 2)
);