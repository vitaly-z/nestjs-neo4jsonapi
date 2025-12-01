import { AgentMessageType } from "../enums/agentmessage.type";

export interface MessageInterface {
  type: AgentMessageType;
  content: string;
}
