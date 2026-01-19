import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../../common";
import { ValidatePromotionCodeDTO } from "../dtos/stripe-promotion-code.dto";
import {
  PromotionCodeValidationResult,
  StripePromotionCodeApiService,
} from "../services/stripe-promotion-code-api.service";

@Controller("stripe-promotion-codes")
@UseGuards(JwtAuthGuard)
export class StripePromotionCodeController {
  constructor(private readonly promotionCodeService: StripePromotionCodeApiService) {}

  @Post("validate")
  async validatePromotionCode(@Body() dto: ValidatePromotionCodeDTO): Promise<PromotionCodeValidationResult> {
    return this.promotionCodeService.validatePromotionCode({
      code: dto.data.attributes.code,
      stripePriceId: dto.data.attributes.stripePriceId,
    });
  }
}
