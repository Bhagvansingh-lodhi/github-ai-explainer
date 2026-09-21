import { parseRepository } from "./repository-parser.js";
import { resolveImports } from "./import-resolver.js";

const repositoryPath =
  "./tmp/eda09494-1c1d-4e2e-9444-a7ffba542a3c/expressjs-express";

const parsedFiles =
  await parseRepository(repositoryPath);

const imports =
  resolveImports(parsedFiles);

console.log(
  JSON.stringify(
    imports.slice(0, 50),
    null,
    2
  )
);