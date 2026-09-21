
import { simpleGit } from "simple-git";
import path from "node:path";
import fs from "node:fs/promises";


const MAX_REPOSITORY_SIZE =
  100 * 1024 * 1024; // 100 MB


function isValidGitHubUrl(
  value: string
): boolean {

  try {

    const url =
      new URL(value);

    return (
      url.protocol === "https:" &&
      url.hostname === "github.com" &&
      url.pathname
        .split("/")
        .filter(Boolean)
        .length >= 2
    );

  } catch {

    return false;
  }
}


function getRepositoryName(
  repoUrl: string
): string {

  const url =
    new URL(repoUrl);

  const parts =
    url.pathname
      .split("/")
      .filter(Boolean)
      .map(
        part =>
          part.replace(
            /\.git$/,
            ""
          )
      );

  return `${parts[0]}-${parts[1]}`;
}


async function getDirectorySize(
  directory: string
): Promise<number> {

  let total = 0;

  async function walk(
    currentDirectory: string
  ): Promise<void> {

    const entries =
      await fs.readdir(
        currentDirectory,
        {
          withFileTypes: true
        }
      );

    for (const entry of entries) {

      if (
        entry.name === ".git"
      ) {
        continue;
      }

      const fullPath =
        path.join(
          currentDirectory,
          entry.name
        );

      if (entry.isDirectory()) {

        await walk(
          fullPath
        );

      } else if (entry.isFile()) {

        const stat =
          await fs.stat(
            fullPath
          );

        total += stat.size;

        if (
          total >
          MAX_REPOSITORY_SIZE
        ) {
          return;
        }
      }
    }
  }

  await walk(directory);

  return total;
}


export async function cloneRepository(
  repoUrl: string,
  projectId: string
) {

  if (
    !isValidGitHubUrl(
      repoUrl
    )
  ) {
    throw new Error(
      "Invalid public GitHub repository URL"
    );
  }


  const repoName =
    getRepositoryName(
      repoUrl
    );


  const destination =
    path.resolve(
      process.env.REPO_BASE_PATH ||
        "./tmp",
      projectId,
      repoName
    );


  await fs.mkdir(
    path.dirname(destination),
    {
      recursive: true
    }
  );


  const git =
    simpleGit();


  await git.clone(
    repoUrl,
    destination,
    [
      "--depth",
      "1"
    ]
  );


  const repositorySize =
    await getDirectorySize(
      destination
    );


  if (
    repositorySize >
    MAX_REPOSITORY_SIZE
  ) {

    await fs.rm(
      path.dirname(destination),
      {
        recursive: true,
        force: true
      }
    );

    throw new Error(
      "Repository is too large. Maximum allowed size is 100 MB."
    );
  }


  return {
    repoName,
    path: destination
  };
}