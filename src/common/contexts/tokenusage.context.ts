import { Annotation } from "@langchain/langgraph";

export const TokenUsageContext = Annotation.Root({
  input: Annotation<number>,
  output: Annotation<number>,
});
