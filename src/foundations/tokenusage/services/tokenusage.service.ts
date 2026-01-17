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
    useVisionCosts?: boolean;
  }): Promise<void> {
    let cost = 0;

    const costConfig = params.useVisionCosts ? this.aiConfig.vision : this.aiConfig.ai;

    if (costConfig.inputCostPer1MTokens !== 0 && costConfig.outputCostPer1MTokens !== 0) {
      cost =
        (costConfig.inputCostPer1MTokens * params.tokens.input) / 1000000 +
        (costConfig.outputCostPer1MTokens * params.tokens.output) / 1000000;
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
