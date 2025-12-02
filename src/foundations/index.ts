/**
 * Foundation modules - domain-specific business logic modules
 */

// Centralized FoundationsModule - import all foundation modules with single forRoot()
export { FoundationsModule, FoundationsModuleOptions } from "./foundations.modules";

// Individual foundation modules with entities, metas, repositories, and services
export { AtomicFactModule, AtomicFact, AtomicFactRepository } from "./atomicfact";
export { AuditModule, Audit, auditMeta, auditModel, AuditRepository, AuditService } from "./audit";
export { AuthModule } from "./auth";
export { ChunkModule, Chunk, ChunkRepository } from "./chunk";
export { ChunkerModule } from "./chunker";
export { CompanyModule, Company, companyMeta, CompanyModel, CompanyRepository, CompanyService } from "./company";
export { ContentModule } from "./content";
export { FeatureModule } from "./feature";
export { KeyConceptModule, KeyConcept, KeyConceptRepository } from "./keyconcept";
export { ModuleModule, ModuleEntity, moduleMeta, ModuleModel, ModuleRepository } from "./module";
export { NotificationModule } from "./notification";
export { PushModule } from "./push";
export { RelevancyModule } from "./relevancy";
export { RoleModule } from "./role";
export { S3Module, S3Service } from "./s3";
export { TokenUsageModule } from "./tokenusage";
export { UserModule, User, userMeta, ownerMeta, UserModel, UserRepository, UserService } from "./user";
