import { parseJavaScript } from "./parser.js";

const code = `
import express from "express";

const PORT = 3000;

function startServer() {
  console.log("Starting server");
}

class UserService {
  getUser() {
    return {};
  }
}

export { startServer };
`;

const result = parseJavaScript(code);

console.log(
  JSON.stringify(result, null, 2)
);