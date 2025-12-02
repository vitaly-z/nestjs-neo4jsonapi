import { Annotation } from "@langchain/langgraph";
import { AgentMessageType } from "../../../common/enums/agentmessage.type";

export const HistoryContext = Annotation.Root({
  type: Annotation<AgentMessageType>,
  content: Annotation<string>,
});
