import { Annotation } from "@langchain/langgraph";

export const CitationContext = Annotation.Root({
  chunkId: Annotation<string>,
  relevance: Annotation<number>,
});
