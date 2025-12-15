import { Module } from "@nestjs/common";
import { LLMModule } from "../../core/llm/llm.module";
import { LoggingModule } from "../../core/logging/logging.module";
import { TracingModule } from "../../core/tracing/tracing.module";
import { CompanyModule } from "../../foundations/company/company.module";
import { CommunityModule } from "../../foundations/community/community.module";
import { CommunityDetectorModule } from "../community.detector/community.detector.module";
import { CommunitySearchNodeService } from "./nodes/community.search.node.service";
import { FollowUpNodeService } from "./nodes/followup.node.service";
import { HydeNodeService } from "./nodes/hyde.node.service";
import { PrimerAnswerNodeService } from "./nodes/primer.answer.node.service";
import { SynthesisNodeService } from "./nodes/synthesis.node.service";
import { DriftMigrationService } from "./services/drift.migration.service";
import { DriftSearchService } from "./services/drift.search.service";

@Module({
  imports: [LLMModule, LoggingModule, TracingModule, CommunityModule, CompanyModule, CommunityDetectorModule],
  providers: [
    // Node services
    HydeNodeService,
    CommunitySearchNodeService,
    PrimerAnswerNodeService,
    FollowUpNodeService,
    SynthesisNodeService,
    // Main services
    DriftSearchService,
    DriftMigrationService,
  ],
  exports: [DriftSearchService, DriftMigrationService],
})
export class DriftModule {}
