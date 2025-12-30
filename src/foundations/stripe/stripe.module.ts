import { Module, OnModuleInit, forwardRef } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { QueueId } from "../../config/enums/queue.id";
import { createWorkerProvider } from "../../common/decorators/conditional-service.decorator";
import { modelRegistry } from "../../common/registries/registry";
import { BillingController } from "./controllers/billing.controller";
import { WebhookController } from "./controllers/webhook.controller";
import { BillingCustomerModel } from "./entities/billing-customer.model";
import { InvoiceModel } from "./entities/invoice.model";
import { SubscriptionModel } from "./entities/subscription.model";
import { UsageRecordModel } from "./entities/usage-record.model";
import { WebhookEventModel } from "./entities/webhook-event.model";
import { WebhookProcessor } from "./processors/webhook.processor";
import { BillingCustomerRepository } from "./repositories/billing-customer.repository";
import { InvoiceRepository } from "./repositories/invoice.repository";
import { SubscriptionRepository } from "./repositories/subscription.repository";
import { UsageRecordRepository } from "./repositories/usage-record.repository";
import { WebhookEventRepository } from "./repositories/webhook-event.repository";
import { BillingCustomerSerialiser } from "./serialisers/billing-customer.serialiser";
import { InvoiceSerialiser } from "./serialisers/invoice.serialiser";
import { SubscriptionSerialiser } from "./serialisers/subscription.serialiser";
import { UsageRecordSerialiser } from "./serialisers/usage-record.serialiser";
import { WebhookEventSerialiser } from "./serialisers/webhook-event.serialiser";
import { BillingService } from "./services/billing.service";
import { InvoiceService } from "./services/invoice.service";
import { SubscriptionService } from "./services/subscription.service";
import { UsageService } from "./services/usage.service";
import { NotificationService } from "./services/notification.service";
import { StripeService } from "./services/stripe.service";
import { StripeCustomerService } from "./services/stripe.customer.service";
import { StripeInvoiceService } from "./services/stripe.invoice.service";
import { StripePaymentService } from "./services/stripe.payment.service";
import { StripePortalService } from "./services/stripe.portal.service";
import { StripeSubscriptionService } from "./services/stripe.subscription.service";
import { StripeUsageService } from "./services/stripe.usage.service";
import { StripeWebhookService } from "./services/stripe.webhook.service";
import { StripeProductModule } from "../stripe-product/stripe-product.module";
import { StripePriceModule } from "../stripe-price/stripe-price.module";

@Module({
  imports: [
    forwardRef(() => StripeProductModule),
    StripePriceModule,
    BullModule.registerQueue({ name: QueueId.BILLING_WEBHOOK }),
    BullModule.registerQueue({ name: QueueId.EMAIL }),
  ],
  controllers: [BillingController, WebhookController],
  providers: [
    // Stripe API Services
    StripeService,
    StripeCustomerService,
    StripeInvoiceService,
    StripePaymentService,
    StripePortalService,
    StripeSubscriptionService,
    StripeUsageService,
    StripeWebhookService,
    // Business Logic Services
    BillingService,
    SubscriptionService,
    InvoiceService,
    UsageService,
    NotificationService,
    // Repositories
    BillingCustomerRepository,
    SubscriptionRepository,
    InvoiceRepository,
    UsageRecordRepository,
    WebhookEventRepository,
    // Serializers
    BillingCustomerSerialiser,
    SubscriptionSerialiser,
    InvoiceSerialiser,
    UsageRecordSerialiser,
    WebhookEventSerialiser,
    // Processor only runs in Worker mode via createWorkerProvider
    createWorkerProvider(WebhookProcessor),
  ],
  exports: [
    // Stripe API Services
    StripeService,
    StripeCustomerService,
    StripeInvoiceService,
    StripePaymentService,
    StripePortalService,
    StripeSubscriptionService,
    StripeUsageService,
    StripeWebhookService,
    // Business Logic Services
    BillingService,
    SubscriptionService,
    InvoiceService,
    UsageService,
    NotificationService,
    // Repositories
    BillingCustomerRepository,
    SubscriptionRepository,
    InvoiceRepository,
    UsageRecordRepository,
    WebhookEventRepository,
  ],
})
export class StripeModule implements OnModuleInit {
  onModuleInit() {
    modelRegistry.register(BillingCustomerModel);
    modelRegistry.register(SubscriptionModel);
    modelRegistry.register(InvoiceModel);
    modelRegistry.register(UsageRecordModel);
    modelRegistry.register(WebhookEventModel);
  }
}
