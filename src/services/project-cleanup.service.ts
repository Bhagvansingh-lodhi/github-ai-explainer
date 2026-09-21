import fs from "node:fs/promises";
import path from "node:path";

const PROJECT_MAX_AGE =
  60 * 60 * 1000; // 1 hour


export async function cleanupOldProjects() {

  const basePath =
    path.resolve(
      process.env.REPO_BASE_PATH ||
        "./tmp"
    );


  let entries;

  try {

    entries =
      await fs.readdir(
        basePath,
        {
          withFileTypes: true
        }
      );

  } catch {

    return;
  }


  const now =
    Date.now();


  for (const entry of entries) {

    if (!entry.isDirectory()) {
      continue;
    }


    const projectPath =
      path.join(
        basePath,
        entry.name
      );


    try {

      const stat =
        await fs.stat(
          projectPath
        );


      const age =
        now -
        stat.mtimeMs;


      if (
        age >
        PROJECT_MAX_AGE
      ) {

        console.log(
          `Removing old project: ${entry.name}`
        );


        await fs.rm(
          projectPath,
          {
            recursive: true,
            force: true
          }
        );
      }

    } catch (error) {

      console.error(
        `Failed to cleanup ${projectPath}`,
        error
      );
    }
  }
}