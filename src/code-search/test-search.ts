import { searchCode } from "./code-search.js";

const repositoryPath =
  "./tmp/eda09494-1c1d-4e2e-9444-a7ffba542a3c/expressjs-express";

const results =
  await searchCode(
    repositoryPath,
    "middleware"
  );

console.log(
  JSON.stringify(
    results,
    null,
    2
  )
);