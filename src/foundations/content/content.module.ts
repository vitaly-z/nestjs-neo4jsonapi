import { DynamicModule, Module, OnModuleInit } from "@nestjs/common";
import { modelRegistry } from "../../common/registries/registry";
import { RelevancyModule } from "../relevancy/relevancy.module";
import { ContentController } from "./controllers/content.controller";
import { ContentModel } from "./entities/content.model";
import { createExtendedContentModel } from "./factories/content.model.factory";
import { ContentExtensionConfig, CONTENT_EXTENSION_CONFIG } from "./interfaces/content.extension.interface";
import { ContentRepository } from "./repositories/content.repository";
import { ContentSerialiser } from "./serialisers/content.serialiser";
import { ContentCypherService } from "./services/content.cypher.service";
import { ContentService } from "./services/content.service";

/**
 * ContentModule - Configurable module for Content management.
 *
 * Supports optional extension via ContentExtensionConfig to add additional
 * relationships to Content responses. When extended, the module will:
 * - Register an extended ContentModel with additional childrenTokens
 * - Inject extension config into CypherService and Serialiser
 * - Generate OPTIONAL MATCH clauses for extension relationships
 * - Include extension relationships in JSON:API output
 *
 * @example
 * ```typescript
 * // Without extension (default behavior)
 * ContentModule.forRoot()
 *
 * // With extension
 * ContentModule.forRoot({
 *   additionalRelationships: [
 *     { model: topicMeta, relationship: 'HAS_KNOWLEDGE', direction: 'in', cardinality: 'many' },
 *   ],
 * })
 * ```
 */
@Module({})
export class ContentModule implements OnModuleInit {
  private static extension?: ContentExtensionConfig;

  /**
   * Configure ContentModule with optional extension.
   *
   * @param extension - Optional configuration for additional relationships
   * @returns DynamicModule configured with extension support
   */
  static forRoot(extension?: ContentExtensionConfig): DynamicModule {
    ContentModule.extension = extension;

    return {
      module: ContentModule,
      global: true, // Make module global so ContentCypherService is available to other modules
      controllers: [ContentController],
      providers: [
        {
          provide: CONTENT_EXTENSION_CONFIG,
          useValue: extension,
        },
        ContentSerialiser,
        ContentRepository,
        ContentService,
        ContentCypherService,
      ],
      exports: [ContentCypherService, CONTENT_EXTENSION_CONFIG],
      imports: [RelevancyModule],
    };
  }

  onModuleInit() {
    const extension = ContentModule.extension;

    if (extension?.additionalRelationships?.length) {
      // Register extended model (overwrites base model in registry)
      const extendedModel = createExtendedContentModel(extension);
      modelRegistry.register(extendedModel);
    } else {
      // Register base model
      modelRegistry.register(ContentModel);
    }
  }
}
