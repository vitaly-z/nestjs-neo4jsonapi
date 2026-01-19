import { Module, forwardRef } from "@nestjs/common";
import { StripeModule } from "../stripe/stripe.module";
import { StripePromotionCodeController } from "./controllers/stripe-promotion-code.controller";
import { StripePromotionCodeApiService } from "./services/stripe-promotion-code-api.service";

/**
 * Stripe Promotion Code Module
 *
 * Provides promotion code validation functionality for the Stripe billing system.
 * Validates promotion codes against Stripe API and returns discount details.
 *
 * Features:
 * - Validate promotion codes before checkout
 * - Check coupon validity, redemption limits, expiration
 * - Check product restrictions
 * - Check first-time customer restrictions
 * - Return discount details (percentage/amount, duration)
 */
@Module({
  imports: [forwardRef(() => StripeModule)],
  controllers: [StripePromotionCodeController],
  providers: [StripePromotionCodeApiService],
  exports: [StripePromotionCodeApiService],
})
export class StripePromotionCodeModule {}
