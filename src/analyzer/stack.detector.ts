import type { ProjectAnalysis } from "./project.analyzer.js";

export interface TechStack {
  languages: string[];
  frameworks: string[];
  libraries: string[];
  databases: string[];
}

export function detectTechStack(
  analysis: ProjectAnalysis
): TechStack {
  const dependencies = {
    ...(analysis.packageJson?.dependencies ?? {}),
    ...(analysis.packageJson?.devDependencies ?? {})
  };

  const frameworks: string[] = [];
  const libraries: string[] = [];
  const databases: string[] = [];

  if (dependencies["next"]) {
    frameworks.push("Next.js");
  }

  if (dependencies["react"]) {
    libraries.push("React");
  }

  if (dependencies["express"]) {
    frameworks.push("Express");
  }

  if (dependencies["nestjs"] || dependencies["@nestjs/core"]) {
    frameworks.push("NestJS");
  }

  if (dependencies["prisma"] || dependencies["@prisma/client"]) {
    libraries.push("Prisma");
  }

  if (
    dependencies["pg"] ||
    dependencies["postgres"] ||
    dependencies["postgresql"]
  ) {
    databases.push("PostgreSQL");
  }

  if (
    dependencies["mongoose"] ||
    dependencies["mongodb"]
  ) {
    databases.push("MongoDB");
  }

  if (
    dependencies["mysql"] ||
    dependencies["mysql2"]
  ) {
    databases.push("MySQL");
  }

  return {
    languages: analysis.languages,
    frameworks,
    libraries,
    databases
  };
}