import { DynamicModule, Module, Provider } from "@nestjs/common";
import { ContextualiserContextFactoryService } from "../contextualiser/factories/contextualiser.context.factory";
import { AtomicFactsNodeService } from "../contextualiser/nodes/atomicfacts.node.service";
import { ChunkNodeService } from "../contextualiser/nodes/chunk.node.service";
import { ChunkVectorNodeService } from "../contextualiser/nodes/chunk.vector.node.service";
import { KeyConceptsNodeService } from "../contextualiser/nodes/keyconcepts.node.service";
import { QuestionRefinerNodeService } from "../contextualiser/nodes/question.refiner.node.service";
import { RationalNodeService } from "../contextualiser/nodes/rational.node.service";
import { ContextualiserService } from "../contextualiser/services/contextualiser.service";
import { LLMModule } from "../../core/llm/llm.module";
import { AtomicFactModule } from "../../foundations/atomicfact/atomicfact.module";
import { CompanyModule } from "../../foundations/company/company.module";
import { KeyConceptModule } from "../../foundations/keyconcept/keyconcept.module";
import { S3Module } from "../../foundations/s3/s3.module";
import { ContextualiserPromptsOptions } from "../prompts/prompt.interfaces";
import {
  CONTEXTUALISER_QUESTION_REFINER_PROMPT,
  CONTEXTUALISER_RATIONAL_PROMPT,
  CONTEXTUALISER_KEYCONCEPTS_PROMPT,
  CONTEXTUALISER_ATOMICFACTS_PROMPT,
  CONTEXTUALISER_CHUNK_PROMPT,
  CONTEXTUALISER_CHUNK_VECTOR_PROMPT,
} from "../prompts/prompt.tokens";

/**
 * Options for ContextualiserModule.forRoot()
 */
export interface ContextualiserModuleOptions {
  /**
   * Custom prompts for Contextualiser nodes (all optional)
   */
  prompts?: ContextualiserPromptsOptions;
}

const BASE_PROVIDERS = [
  ContextualiserContextFactoryService,
  ContextualiserService,
  AtomicFactsNodeService,
  ChunkNodeService,
  KeyConceptsNodeService,
  RationalNodeService,
  QuestionRefinerNodeService,
  ChunkVectorNodeService,
];

// ChunkModule is not imported here because it's provided globally by FoundationsModule.forRoot()
// ChunkService, ChunkRepository are available through dependency injection
const BASE_IMPORTS = [LLMModule, S3Module, CompanyModule, AtomicFactModule, KeyConceptModule];

@Module({})
export class ContextualiserModule {
  /**
   * Configure the ContextualiserModule with custom prompts
   *
   * @example
   * ```typescript
   * ContextualiserModule.forRoot({
   *   prompts: {
   *     questionRefiner: customQuestionRefinerPrompt,
   *     rationalPlan: customRationalPlanPrompt,
   *   },
   * }),
   * ```
   */
  static forRoot(options?: ContextualiserModuleOptions): DynamicModule {
    const providers: Provider[] = [...BASE_PROVIDERS];

    // Add custom prompt providers if specified
    if (options?.prompts?.questionRefiner) {
      providers.push({
        provide: CONTEXTUALISER_QUESTION_REFINER_PROMPT,
        useValue: options.prompts.questionRefiner,
      });
    }

    if (options?.prompts?.rationalPlan) {
      providers.push({
        provide: CONTEXTUALISER_RATIONAL_PROMPT,
        useValue: options.prompts.rationalPlan,
      });
    }

    if (options?.prompts?.keyConcepts) {
      providers.push({
        provide: CONTEXTUALISER_KEYCONCEPTS_PROMPT,
        useValue: options.prompts.keyConcepts,
      });
    }

    if (options?.prompts?.atomicFacts) {
      providers.push({
        provide: CONTEXTUALISER_ATOMICFACTS_PROMPT,
        useValue: options.prompts.atomicFacts,
      });
    }

    if (options?.prompts?.chunk) {
      providers.push({
        provide: CONTEXTUALISER_CHUNK_PROMPT,
        useValue: options.prompts.chunk,
      });
    }

    if (options?.prompts?.chunkVector) {
      providers.push({
        provide: CONTEXTUALISER_CHUNK_VECTOR_PROMPT,
        useValue: options.prompts.chunkVector,
      });
    }

    return {
      module: ContextualiserModule,
      providers,
      exports: [ContextualiserContextFactoryService, ContextualiserService],
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
