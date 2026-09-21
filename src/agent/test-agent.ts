import "dotenv/config";

import {
  HumanMessage
} from "@langchain/core/messages";

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
  analyzeProject
} from "../analyzer/project.analyzer.js";

import {
  detectTechStack
} from "../analyzer/stack.detector.js";

import {
  detectImportantFiles
} from "../analyzer/important-files.js";

import {
  buildProjectContext
} from "./project-context.js";

import {
  createAgentGraph
} from "./graph.js";


// ========================================
// Repository
// ========================================

const repositoryPath =
  "./tmp/eda09494-1c1d-4e2e-9444-a7ffba542a3c/expressjs-express";

const repositoryName =
  "expressjs-express";


// ========================================
// 1. Parse repository
// ========================================

console.log(
  "\nParsing repository..."
);

const parsedFiles =
  await parseRepository(
    repositoryPath
  );

console.log(
  `Parsed ${parsedFiles.length} files`
);


// ========================================
// 2. Build code graph
// ========================================

console.log(
  "\nBuilding code graph..."
);

const codeGraph =
  buildCodeGraph(
    parsedFiles
  );

console.log(
  `Graph nodes: ${codeGraph.nodes.length}`
);

console.log(
  `Graph edges: ${codeGraph.edges.length}`
);


// ========================================
// 3. Build symbol index
// ========================================

console.log(
  "\nBuilding symbol index..."
);

const symbolIndex =
  buildSymbolIndex(
    codeGraph
  );

console.log(
  `Definitions: ${symbolIndex.definitions.size}`
);

console.log(
  `References: ${symbolIndex.references.size}`
);


// ========================================
// 4. Analyze project
// ========================================

console.log(
  "\nAnalyzing project..."
);

const analysis =
  await analyzeProject(
    repositoryPath
  );


// ========================================
// 5. Detect tech stack
// ========================================

console.log(
  "\nDetecting tech stack..."
);

const techStack =
  detectTechStack(
    analysis
  );

console.log(
  "Languages:",
  techStack.languages
);

console.log(
  "Frameworks:",
  techStack.frameworks
);

console.log(
  "Libraries:",
  techStack.libraries
);

console.log(
  "Databases:",
  techStack.databases
);


// ========================================
// 6. Detect important files
// ========================================

console.log(
  "\nDetecting important files..."
);

const importantFiles =
  await detectImportantFiles(
    repositoryPath
  );


// ========================================
// 7. Build project context
// ========================================

console.log(
  "\nBuilding project context..."
);

const projectContext =
  await buildProjectContext(
    repositoryPath,
    repositoryName,
    analysis,
    techStack,
    importantFiles
  );

console.log(
  "Project context ready."
);


// ========================================
// 8. Create LangGraph agent
// ========================================

console.log(
  "\nCreating Gemini agent..."
);

const agent =
  createAgentGraph(
    repositoryPath,
    codeGraph,
    symbolIndex,
    projectContext
  );

console.log(
  "Agent ready."
);


// ========================================
// 9. Ask question
// ========================================

console.log(
  "\nAsking agent..."
);

const result =
  await agent.invoke({
    messages: [
     new HumanMessage(
  "Trace the flow starting from the listen function. Show which functions are called and explain the execution flow."
)
    ]
  });


// ========================================
// 10. Get final answer
// ========================================

const lastMessage =
  result.messages[
    result.messages.length - 1
  ];

console.log(
  "\n========================================"
);

console.log(
  "FINAL ANSWER"
);

console.log(
  "========================================\n"
);

console.log(
  lastMessage.content
);