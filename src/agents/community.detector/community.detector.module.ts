import { Module } from "@nestjs/common";
import { CommunityDetectorService } from "./services/community.detector.service";
import { LoggingModule } from "../../core/logging/logging.module";
import { CommunityModule } from "../../foundations/community/community.module";

@Module({
  imports: [LoggingModule, CommunityModule],
  providers: [CommunityDetectorService],
  exports: [CommunityDetectorService],
})
export class CommunityDetectorModule {}
