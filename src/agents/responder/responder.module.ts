import { DynamicModule, Module, Provider } from "@nestjs/common";
import { ContextualiserModule } from "../contextualiser/contextualiser.module";
import { ResponderContextFactoryService } from "../responder/factories/responder.context.factory";
import { ResponderAnswerNodeService } from "../responder/nodes/responder.answer.node.service";
import { ResponderService } from "../responder/services/responder.service";
import { LLMModule } from "../../core/llm/llm.module";
import { CompanyModule } from "../../foundations/company/company.module";
import { S3Module } from "../../foundations/s3/s3.module";
import { RESPONDER_ANSWER_PROMPT } from "../prompts/prompt.tokens";

/**
 * Options for ResponderModule.forRoot()
 */
export interface ResponderModuleOptions {
  /**
   * Custom prompt for generating final answers
   */
  prompt?: string;
}

const BASE_PROVIDERS = [ResponderContextFactoryService, ResponderService, ResponderAnswerNodeService];

const BASE_IMPORTS = [LLMModule, S3Module, CompanyModule, ContextualiserModule.forFeature()];

@Module({})
export class ResponderModule {
  /**
   * Configure the ResponderModule with custom prompt
   *
   * @example
   * ```typescript
   * ResponderModule.forRoot({
   *   prompt: customAnswerPrompt,
   * }),
   * ```
   */
  static forRoot(options?: ResponderModuleOptions): DynamicModule {
    const providers: Provider[] = [...BASE_PROVIDERS];

    if (options?.prompt) {
      providers.push({
        provide: RESPONDER_ANSWER_PROMPT,
        useValue: options.prompt,
      });
    }

    return {
      module: ResponderModule,
      providers,
      exports: [ResponderService],
      imports: BASE_IMPORTS,
    };
  }

  /**
   * Use default configuration
   */
  static forFeature(): DynamicModule {
    return this.forRoot();
  }
}
