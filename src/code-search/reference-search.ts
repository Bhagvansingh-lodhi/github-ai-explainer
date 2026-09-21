import type {
  SymbolIndex,
  SymbolReference
} from "../code-parser/symbol-index.js";

export function findReferences(
  index: SymbolIndex,
  symbolName: string
): SymbolReference[] {
  return (
    index.references.get(
      symbolName
    ) ?? []
  );
}