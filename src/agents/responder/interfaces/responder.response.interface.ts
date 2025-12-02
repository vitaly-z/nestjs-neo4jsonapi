import { ContextualiserResponseInterface } from "../../contextualiser/interfaces/contextualiser.response.interface";
import { AgentMessageType } from "../../../common/enums/agentmessage.type";
import { TokenUsageInterface } from "../../../common/interfaces/token.usage.interface";

export interface ResponderResponseInterface {
  type: AgentMessageType;
  context: ContextualiserResponseInterface;
  tokens: TokenUsageInterface;
  answer: {
    title: string;
    analysis: string;
    answer: any;
    questions: string[];
  };
  sources: { chunkId: string; relevance: number; reason: string }[];
  ontologies: string[];
}
