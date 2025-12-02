import { Annotation } from "@langchain/langgraph";

export const PromptContext = Annotation.Root({
  initial: Annotation<string>,
  answer: Annotation<string>,
});
