import { Annotation } from "@langchain/langgraph";

export const NotebookContext = Annotation.Root({
  chunkId: Annotation<string>,
  content: Annotation<string>,
  reason: Annotation<string>,
});
