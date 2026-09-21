import "dotenv/config";

import express from "express";
import cors from "cors";

import {
  cleanupOldProjects
} from "./services/project-cleanup.service.js";

import projectRoutes from "./routes/project.routes.js";


const app = express();


// ========================================
// Middleware
// ========================================

app.use(cors());

app.use(
  express.json({
    limit: "1mb"
  })
);


// ========================================
// Health check
// ========================================

app.get(
  "/health",
  (_req, res) => {
    res.json({
      ok: true,
      service: "github-ai-explainer"
    });
  }
);


// ========================================
// Project routes
// ========================================

app.use(
  "/api/projects",
  projectRoutes
);


// ========================================
// Cleanup old repositories
// ========================================

cleanupOldProjects().catch(
  (error) => {
    console.error(
      "Project cleanup failed:",
      error
    );
  }
);


// ========================================
// Start server
// ========================================

const PORT =
  Number(process.env.PORT) || 4000;


app.listen(
  PORT,
  "0.0.0.0",
  () => {
    console.log(
      `Server running on http://localhost:${PORT}`
    );
  }
);