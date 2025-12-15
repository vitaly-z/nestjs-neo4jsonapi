import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";
import { QueueId } from "../../config";
import { LLMModule } from "../../core/llm/llm.module";
import { LoggingModule } from "../../core/logging/logging.module";
import { CommunityModule } from "../../foundations/community/community.module";
import { CommunitySummariserProcessor } from "./processors/community.summariser.processor";
import { CommunitySummariserService } from "./services/community.summariser.service";

@Module({
  imports: [
    LLMModule,
    LoggingModule,
    CommunityModule,
    BullModule.registerQueue({ name: QueueId.COMMUNITY_SUMMARISER }),
  ],
  providers: [CommunitySummariserService, CommunitySummariserProcessor],
  exports: [CommunitySummariserService],
})
export class CommunitySummariserModule {}
