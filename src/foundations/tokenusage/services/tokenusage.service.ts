import { Injectable } from "@nestjs/common";
import { randomUUID } from "crypto";
import { baseConfig } from "../../../config/base.config";
import { TokenUsageInterface } from "../../../common/interfaces/token.usage.interface";
import { TokenUsageType } from "../../tokenusage/enums/tokenusage.type";
import { TokenUsageRepository } from "../../tokenusage/repositories/tokenusage.repository";

@Injectable()
export class TokenUsageService {
  private readonly aiConfig = baseConfig.ai;

  constructor(private readonly tokenUsageRepository: TokenUsageRepository) {}

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
