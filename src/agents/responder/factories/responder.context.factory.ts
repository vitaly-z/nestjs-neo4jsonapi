import { Injectable } from "@nestjs/common";
import { ContextualiserContextFactoryService } from "../../contextualiser/factories/contextualiser.context.factory";
import { ResponderContextState } from "../../responder/contexts/responder.context";
import { ResponderResponseInterface } from "../../responder/interfaces/responder.response.interface";
import { AgentMessageType } from "../../../common/enums/agentmessage.type";
import { DataLimits } from "../../../common/types/data.limits";

@Injectable()
export class ResponderContextFactoryService {
  constructor(private readonly contextualiserContextFactoryService: ContextualiserContextFactoryService) {}

  create(params: {
    companyId: string;
    contentId: string;
    contentType: string;
    dataLimits: DataLimits;
    useDrift?: boolean;
  }): ResponderContextState {
    const response: ResponderContextState = {
      companyId: params.companyId,
      contentId: params.contentId,
      contentType: params.contentType,
      dataLimits: params.dataLimits,
      useDrift: params.useDrift ?? false,
      driftContext: undefined,
      context: undefined,
      tokens: undefined,
      finalAnswer: undefined,
      sources: undefined,
      ontologies: undefined,
    };

    return response;
  }

  createAnswer(params: { state: ResponderContextState }): ResponderResponseInterface {
    return {
      type: AgentMessageType.Assistant,
      context: this.contextualiserContextFactoryService.createAnswer({ state: params.state.context }),
      tokens: params.state.tokens,
      answer: params.state.finalAnswer,
      sources: params.state.sources,
      ontologies: params.state.ontologies,
    };
  }
}
