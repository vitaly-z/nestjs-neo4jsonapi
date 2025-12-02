import { DynamicModule, Module, Provider } from "@nestjs/common";
import { SummariserService } from "../summariser/services/summariser.service";
import { LLMModule } from "../../core/llm/llm.module";
import { SummariserPromptsOptions } from "../prompts/prompt.interfaces";
import { SUMMARISER_MAP_PROMPT, SUMMARISER_COMBINE_PROMPT, SUMMARISER_TLDR_PROMPT } from "../prompts/prompt.tokens";

/**
 * Options for SummariserModule.forRoot()
 */
export interface SummariserModuleOptions {
  /**
   * Custom prompts for Summariser operations (all optional)
   */
  prompts?: SummariserPromptsOptions;
}

@Module({})
export class SummariserModule {
  /**
   * Configure the SummariserModule with custom prompts
   *
   * @example
   * ```typescript
   * SummariserModule.forRoot({
   *   prompts: {
   *     map: customMapPrompt,
   *     combine: customCombinePrompt,
   *     tldr: customTldrPrompt,
   *   },
   * }),
   * ```
   */
  static forRoot(options?: SummariserModuleOptions): DynamicModule {
    const providers: Provider[] = [SummariserService];

    if (options?.prompts?.map) {
      providers.push({
        provide: SUMMARISER_MAP_PROMPT,
        useValue: options.prompts.map,
      });
    }

    if (options?.prompts?.combine) {
      providers.push({
        provide: SUMMARISER_COMBINE_PROMPT,
        useValue: options.prompts.combine,
      });
    }

    if (options?.prompts?.tldr) {
      providers.push({
        provide: SUMMARISER_TLDR_PROMPT,
        useValue: options.prompts.tldr,
      });
    }

    return {
      module: SummariserModule,
      providers,
      exports: [SummariserService],
      imports: [LLMModule],
    };
  }

  /**
   * Use default configuration
   */
  static forFeature(): DynamicModule {
    return this.forRoot();
  }
}
