import { DynamicModule, Global, Module, Type } from "@nestjs/common";
import { AtomicFactModule } from "./atomicfact/atomicfact.module";
import { AuditModule } from "./audit/audit.module";
import { AuthModule } from "./auth/auth.module";
import { ChunkModule } from "./chunk/chunk.module";
import { ChunkerModule } from "./chunker/chunker.module";
import { CompanyModule } from "./company/company.module";
import { ContentModule } from "./content/content.module";
import { FeatureModule } from "./feature/feature.module";
import { KeyConceptModule } from "./keyconcept/keyconcept.module";
import { ModuleModule } from "./module/module.module";
import { NotificationModule } from "./notification/notification.module";
import { PushModule } from "./push/push.module";
import { RelevancyModule } from "./relevancy/relevancy.module";
import { RoleModule } from "./role/role.module";
import { S3Module } from "./s3/s3.module";
import { TokenUsageModule } from "./tokenusage/tokenusage.module";
import { UserModule } from "./user/user.module";

/**
 * Base foundation modules (without ChunkModule which needs forRoot options)
 */
const BASE_FOUNDATION_MODULES = [
  AtomicFactModule,
  AuditModule,
  AuthModule,
  ChunkerModule,
  CompanyModule,
  ContentModule,
  FeatureModule,
  KeyConceptModule,
  ModuleModule,
  NotificationModule,
  PushModule,
  RelevancyModule,
  RoleModule,
  S3Module,
  TokenUsageModule,
  UserModule,
];

export interface FoundationsModuleOptions {
  /**
   * Queue IDs for ChunkModule to register with BullMQ
   */
  chunkQueueIds: string[];
}

/**
 * FoundationsModule - Centralized module for all foundation/domain modules
 *
 * Foundation modules provide business domain logic:
 * - User management (UserModule)
 * - Company management (CompanyModule)
 * - Authentication (AuthModule)
 * - Content & document processing (ContentModule, ChunkModule, ChunkerModule)
 * - Knowledge graph entities (AtomicFactModule, KeyConceptModule)
 * - Notifications (NotificationModule, PushModule)
 * - And more...
 *
 * Usage:
 * ```typescript
 * @Module({
 *   imports: [
 *     CoreModule.forRoot(),
 *     FoundationsModule.forRoot({
 *       chunkQueueIds: [QueueId.CHUNK, QueueId.ARTICLE, QueueId.DOCUMENT],
 *     }),
 *   ],
 * })
 * export class AppModule {}
 * ```
 */
@Global()
@Module({})
export class FoundationsModule {
  /**
   * Import all foundation modules
   */
  static forRoot(options: FoundationsModuleOptions): DynamicModule {
    const allModules: (Type<any> | DynamicModule)[] = [
      ...BASE_FOUNDATION_MODULES,
      ChunkModule.forRoot({ queueIds: options.chunkQueueIds }),
    ];

    return {
      module: FoundationsModule,
      imports: allModules,
      exports: [...BASE_FOUNDATION_MODULES, ChunkModule],
      global: true,
    };
  }
}
