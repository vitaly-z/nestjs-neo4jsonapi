import { AgentMessageType } from "../../../common/enums/agentmessage.type";
import { TokenUsageInterface } from "../../../common/interfaces/token.usage.interface";

export interface ContextualiserResponseInterface {
  type: AgentMessageType;
  rationalPlan: string;
  annotations: string;
  notebook: { chunkId: string; content: string }[];
  processedElements: {
    keyConcepts: string[];
    atomicFacts: string[];
    chunks: string[];
  };
  sources: {
    chunkId: string;
    relevance: number;
  }[];
  requests: {
    message: string;
    rawResponse: any;
  }[];
  tokens: TokenUsageInterface;
}
