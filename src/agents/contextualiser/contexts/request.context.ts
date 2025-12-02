import { Annotation } from "@langchain/langgraph";

export const RequestContext = Annotation.Root({
  message: Annotation<string>,
  rawResponse: Annotation<any>,
});
