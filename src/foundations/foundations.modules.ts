import { Module } from "@nestjs/common";
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
 * All foundation modules - fully static.
 * Queue registration is handled centrally by QueueModule (via baseConfig.chunkQueues).
 */
const ALL_FOUNDATION_MODULES = [
  AtomicFactModule,
  AuditModule,
  AuthModule,
  ChunkModule,
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
 * Queue configuration is now via baseConfig.chunkQueues - no forRoot() needed.
 *
 * Usage:
 * ```typescript
 * @Module({
 *   imports: [
 *     CoreModule.forRoot(),
 *     FoundationsModule,
 *   ],
 * })
 * export class AppModule {}
 * ```
 */
@Module({
  imports: ALL_FOUNDATION_MODULES,
  exports: ALL_FOUNDATION_MODULES,
})
export class FoundationsModule {}
