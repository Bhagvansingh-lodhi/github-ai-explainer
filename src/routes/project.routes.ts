import { Router } from "express";

import fs from "node:fs/promises";
import path from "node:path";

import {
  HumanMessage
} from "@langchain/core/messages";

import {
  cloneRepository
} from "../services/github.service.js";

import {
  analyzeProject
} from "../analyzer/project.analyzer.js";

import {
  detectTechStack
} from "../analyzer/stack.detector.js";

import {
  detectImportantFiles
} from "../analyzer/important-files.js";

import {
  parseRepository
} from "../code-parser/repository-parser.js";

import {
  buildCodeGraph
} from "../code-parser/code-graph.js";

import {
  buildSymbolIndex
} from "../code-parser/symbol-index.js";

import {
  buildProjectContext
} from "../agent/project-context.js";

import {
  createAgentGraph
} from "../agent/graph.js";

import {
  saveProjectSession,
  getProjectSession
} from "../services/project-session.service.js";


const router = Router();


// ========================================
// ANALYZE PROJECT
// ========================================

router.post(
  "/analyze",
  async (req, res) => {
    try {

      const {
        url
      } = req.body;


      // Validate URL

      if (
        !url ||
        typeof url !== "string"
      ) {
        return res.status(400).json({
          error:
            "GitHub repository URL is required"
        });
      }


      // Create project ID

      const projectId =
        crypto.randomUUID();


      console.log(
        `[${projectId}] Cloning repository...`
      );


      // Clone repository

      const repository =
        await cloneRepository(
          url,
          projectId
        );


      console.log(
        `[${projectId}] Repository cloned: ${repository.repoName}`
      );


      // ------------------------------------
      // Analyze project
      // ------------------------------------

      console.log(
        `[${projectId}] Analyzing project...`
      );


      const analysis =
        await analyzeProject(
          repository.path
        );


      // ------------------------------------
      // Detect tech stack
      // ------------------------------------

      const techStack =
        detectTechStack(
          analysis
        );


      // ------------------------------------
      // Detect important files
      // ------------------------------------

      const importantFiles =
        await detectImportantFiles(
          repository.path
        );


      // ------------------------------------
      // Parse repository
      // ------------------------------------

      console.log(
        `[${projectId}] Parsing repository...`
      );


      const parsedFiles =
        await parseRepository(
          repository.path
        );


      console.log(
        `[${projectId}] Parsed ${parsedFiles.length} files`
      );


      // ------------------------------------
      // Build code graph
      // ------------------------------------

      console.log(
        `[${projectId}] Building code graph...`
      );


      const codeGraph =
        buildCodeGraph(
          parsedFiles
        );


      console.log(
        `[${projectId}] Graph nodes: ${codeGraph.nodes.length}`
      );

      console.log(
        `[${projectId}] Graph edges: ${codeGraph.edges.length}`
      );


      // ------------------------------------
      // Build symbol index
      // ------------------------------------

      console.log(
        `[${projectId}] Building symbol index...`
      );


      const symbolIndex =
        buildSymbolIndex(
          codeGraph
        );


      // ------------------------------------
      // Build project context
      // ------------------------------------

      console.log(
        `[${projectId}] Building project context...`
      );


      const projectContext =
        await buildProjectContext(
          repository.path,
          repository.repoName,
          analysis,
          techStack,
          importantFiles
        );


      // ------------------------------------
      // Save session
      // ------------------------------------

      saveProjectSession({
        projectId,

        repositoryPath:
          repository.path,

        repositoryName:
          repository.repoName,

        parsedFiles,

        codeGraph,

        symbolIndex,

        analysis,

        techStack,

        importantFiles,

        projectContext,

        createdAt:
          Date.now()
      });


      console.log(
        `[${projectId}] Project session saved`
      );


      // ------------------------------------
      // Response
      // ------------------------------------

      return res.json({

        projectId,

        status:
          "analyzed",

        repository: {
          name:
            repository.repoName
        },

        stack:
          techStack,

        importantFiles,

        analysis

      });

    } catch (error) {

      console.error(
        "Project analysis error:",
        error
      );


      return res.status(500).json({
        error:
          error instanceof Error
            ? error.message
            : "Failed to analyze repository"
      });
    }
  }
);


// ========================================
// CHAT WITH PROJECT
// ========================================

router.post(
  "/:projectId/chat",
  async (req, res) => {

    try {

      const {
        projectId
      } = req.params;

      const {
        message
      } = req.body;


      // ------------------------------------
      // Validate project ID
      // ------------------------------------

      if (
        !projectId ||
        typeof projectId !== "string"
      ) {
        return res.status(400).json({
          error:
            "Project ID is required"
        });
      }


      // ------------------------------------
      // Validate message
      // ------------------------------------

      if (
        !message ||
        typeof message !== "string"
      ) {
        return res.status(400).json({
          error:
            "Message is required"
        });
      }


      const trimmedMessage =
        message.trim();


      if (!trimmedMessage) {
        return res.status(400).json({
          error:
            "Message cannot be empty"
        });
      }
const MAX_MESSAGE_LENGTH = 4000;

if (
  trimmedMessage.length >
  MAX_MESSAGE_LENGTH
) {
  return res.status(400).json({
    error:
      "Message is too long. Maximum length is 4000 characters."
  });
}

      // ------------------------------------
      // Get cached project session
      // ------------------------------------

      const session =
        getProjectSession(
          projectId
        );


      if (!session) {

        return res.status(404).json({
          error:
            "Project session expired. Please analyze the repository again."
        });
      }


      console.log(
        `[${projectId}] Using cached project session`
      );


      // ------------------------------------
      // Create agent
      // ------------------------------------

      const agent =
        createAgentGraph(
          session.repositoryPath,
          session.codeGraph,
          session.symbolIndex,
          session.projectContext
        );


      // ------------------------------------
      // Ask agent
      // ------------------------------------

      console.log(
        `[${projectId}] Asking agent...`
      );


      const result =
        await agent.invoke({

          messages: [
            new HumanMessage(
              trimmedMessage
            )
          ]

        });


      // ------------------------------------
      // Get final message
      // ------------------------------------

      const lastMessage =
        result.messages[
          result.messages.length - 1
        ];


      if (!lastMessage) {

        return res.status(500).json({
          error:
            "Agent returned no response"
        });
      }


      // ------------------------------------
      // Return answer
      // ------------------------------------

      return res.json({

        projectId,

        answer:
          lastMessage.content

      });

    } catch (error) {

      console.error(
        "Chat error:",
        error
      );


      return res.status(500).json({
        error:
          error instanceof Error
            ? error.message
            : "Failed to process chat request"
      });
    }
  }
);


export default router;