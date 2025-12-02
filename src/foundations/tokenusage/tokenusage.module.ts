import { Module, OnModuleInit } from "@nestjs/common";
import { modelRegistry } from "../../common/registries/registry";
import { TokenUsageModel } from "./entities/tokenusage.model";
import { TokenUsageRepository } from "./repositories/tokenusage.repository";
import { TokenUsageService } from "./services/tokenusage.service";

@Module({
  controllers: [],
  providers: [TokenUsageRepository, TokenUsageService],
  exports: [TokenUsageService],
  imports: [],
})
export class TokenUsageModule implements OnModuleInit {
  onModuleInit() {
    modelRegistry.register(TokenUsageModel);
  }
}
