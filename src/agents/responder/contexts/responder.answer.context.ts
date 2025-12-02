import { Annotation } from "@langchain/langgraph";

export const ResponderAnswerContext = Annotation.Root({
  title: Annotation<string>,
  analysis: Annotation<string>,
  answer: Annotation<any>,
  questions: Annotation<string[]>,
  hasAnswer: Annotation<boolean>,
});
