import {
  StateGraph,
  START,
  END
} from "@langchain/langgraph";

import {
  ToolNode
} from "@langchain/langgraph/prebuilt";

import {
  ChatGoogleGenerativeAI
} from "@langchain/google-genai";

import {
  SystemMessage
} from "@langchain/core/messages";

import {
  createRepositoryTools
} from "./tools/index.js";

import {
  AgentState
} from "./state.js";

import {
  formatProjectContext,
  type ProjectContext
} from "./project-context.js";

import type {
  CodeGraph
} from "../code-parser/code-graph.js";

import type {
  SymbolIndex
} from "../code-parser/symbol-index.js";


export function createAgentGraph(
  repositoryPath: string,
  codeGraph: CodeGraph,
  symbolIndex: SymbolIndex,
  projectContext: ProjectContext
) {
  // --------------------------------
  // 1. Create repository tools
  // --------------------------------

  const tools =
   createRepositoryTools(
  repositoryPath,
  projectContext.repositoryName,
  codeGraph,
  symbolIndex
);


  // --------------------------------
  // 2. Create Gemini model
  // --------------------------------

  const model =
    new ChatGoogleGenerativeAI({
      model: "gemini-2.5-flash",
      temperature: 0,
      apiKey:
        process.env.GEMINI_API_KEY
    }).bindTools(tools);


  // --------------------------------
  // 3. Build repository context
  // --------------------------------

  const repositoryContext =
    formatProjectContext(
      projectContext
    );


  // --------------------------------
  // 4. System prompt
  // --------------------------------

  const systemMessage =
    new SystemMessage(`
You are an expert GitHub repository
analysis agent.

Your job is to deeply understand the
provided repository and answer questions
about its:

- code
- architecture
- dependencies
- files
- functions
- classes
- APIs
- data flow
- project structure
- configuration

You have access to repository tools
that allow you to inspect the actual
source code.

========================================
REPOSITORY CONTEXT
========================================

${repositoryContext}

========================================
TOOL USAGE RULES
========================================

1. Use repository tools whenever the
   question requires repository-specific
   information.

2. Never invent files, functions,
   dependencies, APIs, architecture,
   or behavior.

3. Use search_code when you need to
   locate relevant code.

4. Use find_definition when you need
   to find where a function, class,
   or variable is defined.

5. Use find_references when you need
   to understand where a symbol is used.

6. Use read_file when you need to
   inspect actual source code.

7. Use get_project_structure when you
   need deeper information about the
   repository organization.

8. Use get_dependencies when you need
   information about packages,
   dependencies, or npm scripts.

9. You may call multiple tools before
   producing the final answer.

10. Follow the evidence from the
    repository rather than guessing.

11. Mention relevant file paths and
    line numbers whenever available.

12. If the repository does not contain
    enough information to answer a
    question, clearly say so.

13. Explain technical concepts clearly
    and step-by-step.

14. When explaining code flow, identify
    the relevant files and functions
    involved.

15. Distinguish clearly between:
    - facts found in the repository
    - reasonable inference
    - information that could not be verified


    16. Use get_project_summary when the user
   asks to explain, summarize, or understand
   the overall project architecture.

17. For project-wide questions, start with
    get_project_summary before inspecting
    individual files when appropriate.

   18. Use trace_function when the user asks
how a function works internally, which
functions it calls, or how execution
continues from a particular function.

 19. When tracing execution, use read_file
after trace_function when actual source
code is needed to explain the implementation.
========================================
IMPORTANT
========================================

Do not claim that you inspected a file
or function unless you actually used
a repository tool to inspect it.

Do not make up source code.

Your goal is to help the user understand
the repository as if you had carefully
read and analyzed the project.
`);


  // --------------------------------
  // 5. Agent node
  // --------------------------------

  async function agentNode(
    state: typeof AgentState.State
  ) {
    const response =
      await model.invoke([
        systemMessage,
        ...state.messages
      ]);

    return {
      messages: [
        response
      ]
    };
  }


  // --------------------------------
  // 6. Tool node
  // --------------------------------

  const toolNode =
    new ToolNode(tools);


  // --------------------------------
  // 7. Decide next step
  // --------------------------------

  function shouldContinue(
    state: typeof AgentState.State
  ) {
    const lastMessage =
      state.messages[
        state.messages.length - 1
      ];

    // No message
    if (!lastMessage) {
      return END;
    }


    // --------------------------------
    // Check Gemini tool calls
    // --------------------------------

    if (
      "tool_calls" in lastMessage &&
      Array.isArray(
        lastMessage.tool_calls
      ) &&
      lastMessage.tool_calls.length > 0
    ) {
      return "tools";
    }


    // --------------------------------
    // No tool call
    // Gemini produced final answer
    // --------------------------------

    return END;
  }


  // --------------------------------
  // 8. Build LangGraph
  // --------------------------------

  const graph =
    new StateGraph(
      AgentState
    )

      // --------------------------------
      // Agent node
      // --------------------------------

      .addNode(
        "agent",
        agentNode
      )


      // --------------------------------
      // Tool node
      // --------------------------------

      .addNode(
        "tools",
        toolNode
      )


      // --------------------------------
      // START → Agent
      // --------------------------------

      .addEdge(
        START,
        "agent"
      )


      // --------------------------------
      // Agent → Tools OR END
      // --------------------------------

      .addConditionalEdges(
        "agent",
        shouldContinue,
        {
          tools: "tools",
          [END]: END
        }
      )


      // --------------------------------
      // Tools → Agent
      // --------------------------------

      .addEdge(
        "tools",
        "agent"
      );


  // --------------------------------
  // 9. Compile
  // --------------------------------

  return graph.compile();
}