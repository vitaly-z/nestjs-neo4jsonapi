import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { randomUUID } from "crypto";
import { BaseConfigInterface, ConfigAiInterface } from "../../../config/interfaces";
import { TokenUsageInterface } from "../../../common/interfaces/token.usage.interface";
import { TokenUsageType } from "../../tokenusage/enums/tokenusage.type";
import { TokenUsageRepository } from "../../tokenusage/repositories/tokenusage.repository";

@Injectable()
export class TokenUsageService {
  constructor(
    private readonly tokenUsageRepository: TokenUsageRepository,
    private readonly configService: ConfigService<BaseConfigInterface>,
  ) {}

  private get aiConfig(): ConfigAiInterface {
    return this.configService.get<ConfigAiInterface>("ai");
  }

  async recordTokenUsage(params: {
    tokens: TokenUsageInterface;
    type: TokenUsageType;
    relationshipId: string;
    relationshipType: string;
  }): Promise<void> {
    let cost = 0;

    if (this.aiConfig.ai.inputCostPer1MTokens !== 0 && this.aiConfig.ai.outputCostPer1MTokens !== 0) {
      cost =
        (this.aiConfig.ai.inputCostPer1MTokens * params.tokens.input) / 1000000 +
        (this.aiConfig.ai.outputCostPer1MTokens * params.tokens.output) / 1000000;
    }

    await this.tokenUsageRepository.create({
      id: randomUUID(),
      tokenUsageType: params.type,
      inputTokens: params.tokens.input,
      outputTokens: params.tokens.output,
      cost: cost,
      relationshipId: params.relationshipId,
      relationshipType: params.relationshipType,
    });
  }
}
