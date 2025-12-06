import { Module } from "@nestjs/common";
import { SummariserService } from "./services/summariser.service";
import { LLMModule } from "../../core/llm/llm.module";

@Module({
  imports: [LLMModule],
  providers: [SummariserService],
  exports: [SummariserService],
})
export class SummariserModule {}
