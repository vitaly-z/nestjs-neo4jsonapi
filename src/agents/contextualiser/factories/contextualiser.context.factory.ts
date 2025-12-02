import { Injectable } from "@nestjs/common";
import { ContextualiserContextState } from "../../contextualiser/contexts/contextualiser.context";
import { ContextualiserResponseInterface } from "../../contextualiser/interfaces/contextualiser.response.interface";
import { AgentMessageType } from "../../../common/enums/agentmessage.type";
import { MessageInterface } from "../../../common/interfaces/message.interface";
import { DataLimits } from "../../../common/types/data.limits";

@Injectable()
export class ContextualiserContextFactoryService {
  constructor() {}

  create(params: {
    companyId: string;
    contentId: string;
    contentType: string;
    dataLimits: DataLimits;
    question?: string;
    mainPrompt?: string;
    finalPrompt?: string;
    previousMessages: MessageInterface[];
    preselectedChunks?: string[];
  }): ContextualiserContextState {
    const response: ContextualiserContextState = {
      companyId: params.companyId,
      contentId: params.contentId,
      contentType: params.contentType,
      hops: 0,
      previousAnalysis: "",
      previousAnswer: "",
      limits: params.dataLimits,
      prompts: {
        initial: params.mainPrompt ?? "",
        answer: params.finalPrompt ?? "",
      },
      status: [],
      chatHistory: params.previousMessages || [],
      question: params.question ?? "",
      rationalPlan: "",
      annotations: "",
      notebook: [],
      chunkLevel: 0,
      queuedChunks: params.preselectedChunks ?? [],
      queuedKeyConcepts: [],
      processedChunks: [],
      processedKeyConcepts: [],
      processedAtomicFacts: [],
      processedNeighbours: [],
      neighbouringAlreadyExplored: false,
      sources: [],
      ontology: [],
      requests: [],
      nextStep: "rational_plan",
      tokens: {
        input: 0,
        output: 0,
      },
    };

    return response;
  }

  createAnswer(params: { state: ContextualiserContextState }): ContextualiserResponseInterface {
    return {
      type: AgentMessageType.Assistant,
      rationalPlan: params.state.rationalPlan,
      annotations: params.state.annotations,
      notebook: params.state.notebook,
      processedElements: {
        chunks: params.state.processedChunks,
        keyConcepts: params.state.processedKeyConcepts,
        atomicFacts: params.state.processedAtomicFacts,
      },
      sources: params.state.sources,
      requests: params.state.requests,
      tokens: params.state.tokens,
    };
  }
}
