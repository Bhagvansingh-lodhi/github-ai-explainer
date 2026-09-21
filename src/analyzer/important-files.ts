import fs from "node:fs/promises";
import path from "node:path";

export interface ImportantFiles {
  entryPoints: string[];
  documentation: string[];
  config: string[];
  sourceDirectories: string[];
  testDirectories: string[];
  databaseFiles: string[];
  dockerFiles: string[];
}

const ENTRY_POINT_NAMES = [
  "index.js",
  "index.ts",
  "index.tsx",
  "main.js",
  "main.ts",
  "main.tsx",
  "server.js",
  "server.ts",
  "app.js",
  "app.ts",
  "app.tsx"
];

const DOCUMENTATION_NAMES = [
  "README.md",
  "Readme.md",
  "readme.md",
  "CONTRIBUTING.md",
  "CHANGELOG.md"
];

const CONFIG_NAMES = [
  "package.json",
  "tsconfig.json",
  "jsconfig.json",
  ".eslintrc",
  ".eslintrc.js",
  ".eslintrc.json",
  ".eslintrc.yml",
  ".prettierrc",
  "vite.config.js",
  "vite.config.ts",
  "next.config.js",
  "next.config.mjs",
  "next.config.ts",
  "nuxt.config.ts",
  "angular.json",
  "webpack.config.js"
];

const SOURCE_DIRECTORIES = [
  "src",
  "app",
  "lib",
  "server",
  "backend",
  "frontend",
  "components",
  "services",
  "api"
];

const TEST_DIRECTORIES = [
  "test",
  "tests",
  "__tests__",
  "spec"
];

const DATABASE_FILE_PATTERNS = [
  "schema.prisma",
  "schema.sql",
  "database.sql",
  "db.sql",
  "migration",
  "migrations"
];

const DOCKER_FILE_NAMES = [
  "Dockerfile",
  "docker-compose.yml",
  "docker-compose.yaml",
  "compose.yml",
  "compose.yaml"
];

async function exists(
  rootDirectory: string,
  relativePath: string
): Promise<boolean> {
  try {
    await fs.access(
      path.join(rootDirectory, relativePath)
    );

    return true;
  } catch {
    return false;
  }
}

async function findDirectories(
  rootDirectory: string,
  names: string[]
): Promise<string[]> {
  const result: string[] = [];

  const entries = await fs.readdir(rootDirectory, {
    withFileTypes: true
  });

  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }

    if (names.includes(entry.name)) {
      result.push(entry.name);
    }
  }

  return result;
}

async function findMatchingFiles(
  rootDirectory: string,
  patterns: string[]
): Promise<string[]> {
  const result: string[] = [];

  const entries = await fs.readdir(rootDirectory, {
    withFileTypes: true
  });

  for (const entry of entries) {
    if (!entry.isFile()) {
      continue;
    }

    const matches = patterns.some((pattern) => {
      return (
        entry.name === pattern ||
        entry.name.includes(pattern)
      );
    });

    if (matches) {
      result.push(entry.name);
    }
  }

  return result;
}

export async function detectImportantFiles(
  rootDirectory: string
): Promise<ImportantFiles> {
  const entryPoints: string[] = [];

  for (const fileName of ENTRY_POINT_NAMES) {
    if (await exists(rootDirectory, fileName)) {
      entryPoints.push(fileName);
    }
  }

  const documentation: string[] = [];

  for (const fileName of DOCUMENTATION_NAMES) {
    if (await exists(rootDirectory, fileName)) {
      documentation.push(fileName);
    }
  }

  const config: string[] = [];

  for (const fileName of CONFIG_NAMES) {
    if (await exists(rootDirectory, fileName)) {
      config.push(fileName);
    }
  }

  const sourceDirectories = await findDirectories(
    rootDirectory,
    SOURCE_DIRECTORIES
  );

  const testDirectories = await findDirectories(
    rootDirectory,
    TEST_DIRECTORIES
  );

  const databaseFiles = await findMatchingFiles(
    rootDirectory,
    DATABASE_FILE_PATTERNS
  );

  const dockerFiles: string[] = [];

  for (const fileName of DOCKER_FILE_NAMES) {
    if (await exists(rootDirectory, fileName)) {
      dockerFiles.push(fileName);
    }
  }

  return {
    entryPoints,
    documentation,
    config,
    sourceDirectories,
    testDirectories,
    databaseFiles,
    dockerFiles
  };
}