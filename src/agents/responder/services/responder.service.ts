import { END, MemorySaver, START, StateGraph } from "@langchain/langgraph";
import { Injectable } from "@nestjs/common";
import { randomUUID } from "crypto";
import { ContextualiserService } from "../../contextualiser/services/contextualiser.service";
import { DriftConfig, DriftSearchService } from "../../drift/services/drift.search.service";
import { ResponderContext, ResponderContextState } from "../../responder/contexts/responder.context";
import { ResponderContextFactoryService } from "../../responder/factories/responder.context.factory";
import { ResponderResponseInterface } from "../../responder/interfaces/responder.response.interface";
import { ResponderAnswerNodeService } from "../../responder/nodes/responder.answer.node.service";
import { MessageInterface } from "../../../common/interfaces/message.interface";
import { DataLimits } from "../../../common/types/data.limits";

@Injectable()
export class ResponderService {
  constructor(
    private readonly responderContextFactoryService: ResponderContextFactoryService,
    private readonly contextualiserService: ContextualiserService,
    private readonly driftSearchService: DriftSearchService,
    private readonly answerNode: ResponderAnswerNodeService,
  ) {}

  async run(params: {
    companyId: string;
    contentId: string;
    contentType: string;
    dataLimits: DataLimits;
    messages: MessageInterface[];
    question?: string;
    useDrift?: boolean;
    driftConfig?: DriftConfig;
  }): Promise<ResponderResponseInterface> {
    const useDrift = params.useDrift ?? false;

    const workflow = new StateGraph(ResponderContext)
      .addNode("contextualiser", async (state) => {
        const context = await this.contextualiserService.run({
          companyId: state.companyId,
          contentId: state.contentId,
          contentType: state.contentType,
          dataLimits: params.dataLimits,
          messages: params.messages,
          question: params.question,
        });

        // Return only modified fields to avoid parallel merge conflicts
        return {
          context,
          tokens: context.tokens,
        };
      })
      .addNode("drift", async (_state) => {
        let question = params.question ?? params.messages[params.messages.length - 1]?.content ?? "";

        // Parse JSON if the question is a stringified message object
        try {
          const parsed = JSON.parse(question);
          if (parsed.content) {
            question = parsed.content;
          }
        } catch {
          // Not JSON, use as-is
        }

        const driftResult = await this.driftSearchService.search({
          question,
          config: params.driftConfig,
        });

        // Return only modified fields to avoid parallel merge conflicts
        return {
          driftContext: driftResult,
        };
      })
      .addNode("answer", async (state: ResponderContextState) => {
        const result = await this.answerNode.execute({
          state: state,
        });
        return result;
      })
      // Conditional routing from START based on useDrift state
      .addConditionalEdges(
        START,
        (state) => {
          if (state.useDrift) {
            return ["contextualiser", "drift"]; // Run both in parallel
          }
          return ["contextualiser"]; // Only contextualiser
        },
        ["contextualiser", "drift"], // Declare all possible destinations
      )
      .addEdge("contextualiser", "answer")
      .addEdge("drift", "answer")
      .addEdge("answer", END);

    const threadId = randomUUID();
    const checkpointer = new MemorySaver();
    const app = workflow.compile({ checkpointer: checkpointer });

    const initialState: ResponderContextState = this.responderContextFactoryService.create({
      companyId: params.companyId,
      contentId: params.contentId,
      contentType: params.contentType,
      dataLimits: params.dataLimits,
      useDrift,
    });

    let finalState: ResponderContextState;
    try {
      finalState = await app.invoke(initialState, {
        configurable: { thread_id: threadId },
        recursionLimit: 100,
      } as any);
    } catch (e) {
      console.error("[WORKFLOW:Responder] Failed with error", {
        error: (e as Error).message,
        errorCode: (e as any).lc_error_code,
        recursionLimit: 100,
      });
      throw e;
    }

    const response: ResponderResponseInterface = this.responderContextFactoryService.createAnswer({
      state: finalState,
    });

    return response;
  }

  /**
   * Run responder with DRIFT + Contextualiser in parallel (convenience method)
   */
  async runWithDrift(params: {
    companyId: string;
    contentId: string;
    contentType: string;
    dataLimits: DataLimits;
    messages: MessageInterface[];
    question?: string;
    driftConfig?: DriftConfig;
  }): Promise<ResponderResponseInterface> {
    return this.run({
      ...params,
      useDrift: true,
    });
  }
}
