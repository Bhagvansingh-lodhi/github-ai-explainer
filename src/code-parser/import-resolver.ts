import path from "node:path";

import type {
  ParsedRepositoryFile
} from "./repository-parser.js";

export interface ResolvedImport {
  fromFile: string;
  toFile: string;
  importedName?: string;
  localName?: string;
}

function normalize(filePath: string): string {
  return filePath.split(path.sep).join("/");
}

function resolveFile(
  currentFile: string,
  source: string,
  files: Set<string>
): string | null {
  if (!source.startsWith(".")) {
    return null;
  }

  const directory =
    path.posix.dirname(
      normalize(currentFile)
    );

  const base =
    path.posix.normalize(
      path.posix.join(
        directory,
        source
      )
    );

  const candidates = [
  base,
  `${base}.js`,
  `${base}.jsx`,
  `${base}.mjs`,
  `${base}.cjs`,
  `${base}.ts`,
  `${base}.tsx`,
  `${base}/index.js`,
  `${base}/index.jsx`,
  `${base}/index.ts`,
  `${base}/index.tsx`
];

  return (
    candidates.find((file) =>
      files.has(file)
    ) ?? null
  );
}

export function resolveImports(
  files: ParsedRepositoryFile[]
): ResolvedImport[] {
  const fileSet = new Set(
    files.map((file) =>
      normalize(file.path)
    )
  );

  const resolved: ResolvedImport[] = [];

  for (const file of files) {
    for (const importInfo of file.parsed.imports) {
      const target =
        resolveFile(
          file.path,
          importInfo.source,
          fileSet
        );

      if (!target) {
        continue;
      }

      resolved.push({
        fromFile: normalize(file.path),
        toFile: target,
        importedName:
          importInfo.importedName,
        localName:
          importInfo.localName
      });
    }
  }

  return resolved;
}