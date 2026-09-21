import Parser from "tree-sitter";
import JavaScript from "tree-sitter-javascript";
import TypeScript from "tree-sitter-typescript";

export interface CodeSymbol {
  name: string;
  type: "function" | "class" | "variable";
  startLine: number;
  endLine: number;
}

export interface ImportInfo {
  source: string;
  importedName?: string;
  localName?: string;
  startLine: number;
}

export interface ExportInfo {
  name: string;
  exportedName?: string;
  startLine: number;
}

export interface FunctionCall {
  caller: string;
  callee: string;
  startLine: number;
}

export interface ParsedFile {
  functions: CodeSymbol[];
  classes: CodeSymbol[];
  variables: CodeSymbol[];
  imports: ImportInfo[];
  exports: ExportInfo[];
  calls: FunctionCall[];
}

export type ParserLanguage =
  | "javascript"
  | "typescript"
  | "tsx";

function getLanguage(
  language: ParserLanguage
) {
  if (language === "typescript") {
    return TypeScript.typescript;
  }

  if (language === "tsx") {
    return TypeScript.tsx;
  }

  return JavaScript;
}

function getNodeName(
  node: Parser.SyntaxNode
): string | null {
  const nameNode =
    node.childForFieldName("name");

  return nameNode?.text ?? null;
}

function getCallName(
  node: Parser.SyntaxNode
): string | null {
  const functionNode =
    node.childForFieldName("function");

  if (!functionNode) {
    return null;
  }

  if (
    functionNode.type === "identifier"
  ) {
    return functionNode.text;
  }

  if (
    functionNode.type ===
    "member_expression"
  ) {
    const property =
      functionNode.childForFieldName(
        "property"
      );

    return property?.text ?? null;
  }

  return null;
}

export function parseCode(
  source: string,
  language: ParserLanguage
): ParsedFile {
  const parser = new Parser();

  parser.setLanguage(
    getLanguage(language)
  );

  const tree =
    parser.parse(source);

  const functions: CodeSymbol[] = [];
  const classes: CodeSymbol[] = [];
  const variables: CodeSymbol[] = [];
  const imports: ImportInfo[] = [];
  const exports: ExportInfo[] = [];
  const calls: FunctionCall[] = [];

  const functionStack: string[] = [];

  function visit(
    node: Parser.SyntaxNode
  ): void {
    // -----------------------------
    // Functions
    // -----------------------------

    if (
      node.type === "function_declaration" ||
      node.type === "method_definition"
    ) {
      const name =
        getNodeName(node);

      if (name) {
        functions.push({
          name,
          type: "function",
          startLine:
            node.startPosition.row + 1,
          endLine:
            node.endPosition.row + 1
        });

        functionStack.push(name);
      }
    }

    // -----------------------------
    // Arrow functions
    // -----------------------------

    if (
      node.type === "arrow_function"
    ) {
      const parent =
        node.parent;

      const declarator =
        parent?.type ===
        "variable_declarator"
          ? parent
          : null;

      const nameNode =
        declarator?.childForFieldName(
          "name"
        );

      if (nameNode) {
        const name =
          nameNode.text;

        functions.push({
          name,
          type: "function",
          startLine:
            node.startPosition.row + 1,
          endLine:
            node.endPosition.row + 1
        });

        functionStack.push(name);
      }
    }

    // -----------------------------
    // Classes
    // -----------------------------

    if (
      node.type === "class_declaration"
    ) {
      const name =
        getNodeName(node);

      if (name) {
        classes.push({
          name,
          type: "class",
          startLine:
            node.startPosition.row + 1,
          endLine:
            node.endPosition.row + 1
        });
      }
    }

    // -----------------------------
    // Variables
    // -----------------------------

    if (
      node.type ===
      "lexical_declaration"
    ) {
      for (const child of node.namedChildren) {
        if (
          child.type !==
          "variable_declarator"
        ) {
          continue;
        }

        const name =
          child.childForFieldName(
            "name"
          );

        if (!name) {
          continue;
        }

        // Arrow functions are already
        // recorded as functions.
        const value =
          child.childForFieldName(
            "value"
          );

        if (
          value?.type ===
          "arrow_function"
        ) {
          continue;
        }

        variables.push({
          name: name.text,
          type: "variable",
          startLine:
            child.startPosition.row + 1,
          endLine:
            child.endPosition.row + 1
        });
      }
    }

    // -----------------------------
    // Imports
    // -----------------------------

    if (
      node.type === "import_statement"
    ) {
      const sourceNode =
        node.namedChildren.find(
          (child) =>
            child.type === "string"
        );

      if (sourceNode) {
        imports.push({
          source:
            sourceNode.text.slice(1, -1),
          startLine:
            node.startPosition.row + 1
        });
      }
    }

    // -----------------------------
    // Exports
    // -----------------------------

    if (
      node.type === "export_statement"
    ) {
      const declaration =
        node.namedChildren.find(
          (child) =>
            child.type ===
              "function_declaration" ||
            child.type ===
              "class_declaration" ||
            child.type ===
              "lexical_declaration"
        );

      if (declaration) {
        const name =
          getNodeName(declaration);

        if (name) {
          exports.push({
            name,
            exportedName: name,
            startLine:
              node.startPosition.row + 1
          });
        }
      }
    }

    // -----------------------------
    // Function calls
    // -----------------------------

    if (
      node.type === "call_expression"
    ) {
      const callee =
        getCallName(node);

      const caller =
        functionStack[
          functionStack.length - 1
        ];

      if (callee && caller) {
        calls.push({
          caller,
          callee,
          startLine:
            node.startPosition.row + 1
        });
      }
    }

    // -----------------------------
    // Children
    // -----------------------------

    for (
      const child of node.namedChildren
    ) {
      visit(child);
    }

    // -----------------------------
    // Leave function scope
    // -----------------------------

    if (
      node.type ===
        "function_declaration" ||
      node.type ===
        "method_definition"
    ) {
      const name =
        getNodeName(node);

      if (name) {
        functionStack.pop();
      }
    }

    if (
      node.type === "arrow_function"
    ) {
      const parent =
        node.parent;

      const declarator =
        parent?.type ===
        "variable_declarator"
          ? parent
          : null;

      const nameNode =
        declarator?.childForFieldName(
          "name"
        );

      if (nameNode) {
        functionStack.pop();
      }
    }
  }

  visit(tree.rootNode);

  return {
    functions,
    classes,
    variables,
    imports,
    exports,
    calls
  };
}

export function parseJavaScript(
  source: string
): ParsedFile {
  return parseCode(
    source,
    "javascript"
  );
}

export function parseTypeScript(
  source: string
): ParsedFile {
  return parseCode(
    source,
    "typescript"
  );
}

export function parseTSX(
  source: string
): ParsedFile {
  return parseCode(
    source,
    "tsx"
  );
}