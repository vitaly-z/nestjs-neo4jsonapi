import { DynamicModule, Global, Module } from "@nestjs/common";
import { StripeCustomerService } from "./services/stripe.customer.service";
import { StripeInvoiceService } from "./services/stripe.invoice.service";
import { StripePaymentService } from "./services/stripe.payment.service";
import { StripePortalService } from "./services/stripe.portal.service";
import { StripeProductService } from "./services/stripe.product.service";
import { StripeService } from "./services/stripe.service";
import { StripeSubscriptionService } from "./services/stripe.subscription.service";
import { StripeUsageService } from "./services/stripe.usage.service";
import { StripeWebhookService } from "./services/stripe.webhook.service";

const STRIPE_SERVICES = [
  StripeService,
  StripeCustomerService,
  StripeInvoiceService,
  StripePaymentService,
  StripePortalService,
  StripeProductService,
  StripeSubscriptionService,
  StripeUsageService,
  StripeWebhookService,
];

/**
 * Stripe Module
 *
 * Provides Stripe payment processing integration.
 * Configuration is read from `baseConfig.stripe` directly.
 *
 * Features:
 * - Customer management
 * - Subscription management
 * - Payment intents and setup intents
 * - Usage-based billing with meters
 * - Product and price management
 * - Customer portal
 * - Invoice management
 * - Webhook handling
 */
@Global()
@Module({
  providers: STRIPE_SERVICES,
  exports: STRIPE_SERVICES,
})
export class StripeModule {
  static forRoot(): DynamicModule {
    return {
      module: StripeModule,
      providers: STRIPE_SERVICES,
      exports: STRIPE_SERVICES,
      global: true,
    };
  }
}
