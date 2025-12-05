import { DynamicModule, Module } from "@nestjs/common";
import { ContextualiserModule } from "./contextualiser/contextualiser.module";
import { GraphCreatorModule } from "./graph.creator/graph.creator.module";
import { ResponderModule } from "./responder/responder.module";
import { SummariserModule } from "./summariser/summariser.module";
import { AgentPromptsOptions } from "./prompts/prompt.interfaces";

/**
 * Options for AgentsModule.forRoot()
 */
export interface AgentsModuleOptions {
  /**
   * Custom prompts for all agents (all optional)
   */
  prompts?: AgentPromptsOptions;
}

/**
 * Centralized module for all AI agents.
 *
 * Usage with default prompts:
 * ```typescript
 * AgentsModule.forRoot()
 * ```
 *
 * Usage with custom prompts:
 * ```typescript
 * AgentsModule.forRoot({
 *   prompts: {
 *     graphCreator: customGraphCreatorPrompt,
 *     contextualiser: {
 *       questionRefiner: customQuestionRefinerPrompt,
 *     },
 *     summariser: {
 *       map: customMapPrompt,
 *     },
 *   },
 * })
 * ```
 */
@Module({})
export class AgentsModule {
  static forRoot(options?: AgentsModuleOptions): DynamicModule {
    return {
      module: AgentsModule,
      imports: [
        ContextualiserModule.forRoot({
          prompts: options?.prompts?.contextualiser,
        }),
        GraphCreatorModule.forRoot({
          prompt: options?.prompts?.graphCreator,
        }),
        ResponderModule.forRoot({
          prompt: options?.prompts?.responder,
        }),
        SummariserModule.forRoot({
          prompts: options?.prompts?.summariser,
        }),
      ],
      exports: [ContextualiserModule, GraphCreatorModule, ResponderModule, SummariserModule],
    };
  }

  /**
   * Use default configuration
   */
  static forFeature(): DynamicModule {
    return this.forRoot();
  }
}
