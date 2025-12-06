import { Module } from "@nestjs/common";
import { GraphCreatorService } from "./services/graph.creator.service";
import { LLMModule } from "../../core/llm/llm.module";
import { LoggingModule } from "../../core/logging/logging.module";

@Module({
  imports: [LLMModule, LoggingModule],
  providers: [GraphCreatorService],
  exports: [GraphCreatorService],
})
export class GraphCreatorModule {}
