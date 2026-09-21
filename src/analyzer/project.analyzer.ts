import fs from "node:fs/promises";
import path from "node:path";

const IGNORED_DIRECTORIES = new Set([
  "node_modules",
  ".git",
  ".next",
  "dist",
  "build",
  "coverage",
  "vendor",
  "target",
  "__pycache__"
]);

const IGNORED_FILES = new Set([
  ".DS_Store"
]);

const MAX_FILES = 5000;

export interface FileInfo {
  path: string;
  extension: string;
  size: number;
}

export interface ProjectAnalysis {
  totalFiles: number;
  files: FileInfo[];
  extensions: Record<string, number>;
  languages: string[];
  packageJson?: {
    name?: string;
    version?: string;
    description?: string;
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
    scripts?: Record<string, string>;
  };
}

function getExtension(filePath: string): string {
  const extension = path.extname(filePath).toLowerCase();

  return extension || "[no-extension]";
}

function extensionToLanguage(extension: string): string | null {
  const languages: Record<string, string> = {
    ".ts": "TypeScript",
    ".tsx": "TypeScript",
    ".js": "JavaScript",
    ".jsx": "JavaScript",
    ".py": "Python",
    ".java": "Java",
    ".go": "Go",
    ".rs": "Rust",
    ".cpp": "C++",
    ".c": "C",
    ".cs": "C#",
    ".php": "PHP",
    ".rb": "Ruby",
    ".swift": "Swift",
    ".kt": "Kotlin",
    ".html": "HTML",
    ".css": "CSS",
    ".scss": "SCSS",
    ".sql": "SQL"
  };

  return languages[extension] ?? null;
}

async function scanDirectory(
  directory: string,
  rootDirectory: string,
  files: FileInfo[]
): Promise<void> {
  if (files.length >= MAX_FILES) {
    return;
  }

  const entries = await fs.readdir(directory, {
    withFileTypes: true
  });

  for (const entry of entries) {
    if (files.length >= MAX_FILES) {
      return;
    }

    if (IGNORED_DIRECTORIES.has(entry.name)) {
      continue;
    }

    if (IGNORED_FILES.has(entry.name)) {
      continue;
    }

    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      await scanDirectory(
        fullPath,
        rootDirectory,
        files
      );

      continue;
    }

    if (!entry.isFile()) {
      continue;
    }

    const relativePath = path.relative(
      rootDirectory,
      fullPath
    );

    const stats = await fs.stat(fullPath);

    files.push({
      path: relativePath,
      extension: getExtension(fullPath),
      size: stats.size
    });
  }
}

async function readPackageJson(
  rootDirectory: string
): Promise<ProjectAnalysis["packageJson"]> {
  const packagePath = path.join(
    rootDirectory,
    "package.json"
  );

  try {
    const content = await fs.readFile(
      packagePath,
      "utf-8"
    );

    return JSON.parse(content);
  } catch {
    return undefined;
  }
}

export async function analyzeProject(
  rootDirectory: string
): Promise<ProjectAnalysis> {
  const files: FileInfo[] = [];

  await scanDirectory(
    rootDirectory,
    rootDirectory,
    files
  );

  const extensions: Record<string, number> = {};

  for (const file of files) {
    extensions[file.extension] =
      (extensions[file.extension] || 0) + 1;
  }

  const languageSet = new Set<string>();

  for (const extension of Object.keys(extensions)) {
    const language =
      extensionToLanguage(extension);

    if (language) {
      languageSet.add(language);
    }
  }

  const packageJson =
    await readPackageJson(rootDirectory);

  return {
    totalFiles: files.length,
    files,
    extensions,
    languages: [...languageSet],
    packageJson
  };
}