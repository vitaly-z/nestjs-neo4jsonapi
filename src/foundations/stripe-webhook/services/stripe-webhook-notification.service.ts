import { InjectQueue } from "@nestjs/bullmq";
import { Injectable } from "@nestjs/common";
import { Queue } from "bullmq";
import { AppLoggingService } from "../../../core/logging";
import { QueueId } from "../../../config/enums/queue.id";
import { StripeCustomerRepository } from "../../stripe-customer/repositories/stripe-customer.repository";
import { StripeInvoiceRepository } from "../../stripe-invoice/repositories/stripe-invoice.repository";

export interface StripeWebhookPaymentFailureNotificationParams {
  stripeCustomerId: string;
  stripeInvoiceId?: string;
  stripePaymentIntentId?: string;
  errorMessage?: string;
  amount?: number;
  currency?: string;
}

/**
 * StripeWebhookNotificationService
 *
 * Handles sending notifications for billing events (payment failures, subscription changes, etc.)
 * Uses BullMQ to queue email notifications for non-blocking webhook processing.
 *
 * Key Features:
 * - Queue payment failure notifications via BullMQ
 * - Queue subscription status change notifications
 * - Non-blocking notification processing to prevent webhook delays
 * - Automatic retry logic with exponential backoff
 * - Enriches notifications with customer and invoice data
 */
@Injectable()
export class StripeWebhookNotificationService {
  constructor(
    @InjectQueue(QueueId.EMAIL) private readonly emailQueue: Queue,
    private readonly stripeCustomerRepository: StripeCustomerRepository,
    private readonly stripeInvoiceRepository: StripeInvoiceRepository,
    private readonly logger: AppLoggingService,
  ) {}

  /**
   * Send payment failure notification email
   */
  async sendPaymentFailedEmail(params: StripeWebhookPaymentFailureNotificationParams): Promise<void> {
    const { stripeCustomerId, stripeInvoiceId, stripePaymentIntentId, errorMessage, amount, currency } = params;

    try {
      // Retrieve stripe customer from Neo4j
      const stripeCustomer = await this.stripeCustomerRepository.findByStripeCustomerId({ stripeCustomerId });

      if (!stripeCustomer) {
        this.logger.warn(`Cannot send payment failure notification: Customer ${stripeCustomerId} not found in Neo4j`);
        return;
      }

      // Get invoice details if available
      let invoiceDetails = null;
      if (stripeInvoiceId) {
        invoiceDetails = await this.stripeInvoiceRepository.findByStripeInvoiceId({ stripeInvoiceId });
      }

      // Queue email notification (non-blocking)
      await this.emailQueue.add(
        "billing-notification",
        {
          jobType: "payment-failure" as const,
          payload: {
            to: stripeCustomer.email,
            customerName: stripeCustomer.name || "Customer",
            stripeCustomerId,
            stripeInvoiceId,
            stripePaymentIntentId,
            errorMessage: errorMessage || "Payment failed",
            amount,
            currency: currency || "usd",
            invoiceUrl: invoiceDetails?.stripeHostedInvoiceUrl,
            invoiceNumber: invoiceDetails?.stripeInvoiceNumber || undefined,
            locale: "en",
          },
        },
        {
          attempts: 3,
          backoff: {
            type: "exponential",
            delay: 5000,
          },
        },
      );

      this.logger.log(
        `Queued payment failure notification for customer ${stripeCustomerId}${stripeInvoiceId ? ` (invoice: ${stripeInvoiceId})` : ""}`,
      );
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      this.logger.error(`Failed to queue payment failure notification for ${stripeCustomerId}: ${errorMsg}`);
      // Don't throw - notification failure shouldn't block webhook processing
    }
  }

  /**
   * Send subscription status change notification
   */
  async sendSubscriptionStatusChangeEmail(
    stripeCustomerId: string,
    status: string,
    subscriptionId: string,
  ): Promise<void> {
    try {
      const stripeCustomer = await this.stripeCustomerRepository.findByStripeCustomerId({ stripeCustomerId });

      if (!stripeCustomer) {
        this.logger.warn(`Cannot send subscription notification: Customer ${stripeCustomerId} not found in Neo4j`);
        return;
      }

      await this.emailQueue.add(
        "billing-notification",
        {
          jobType: "subscription-status-change" as const,
          payload: {
            to: stripeCustomer.email,
            customerName: stripeCustomer.name || "Customer",
            stripeCustomerId,
            subscriptionId,
            status,
            locale: "en",
          },
        },
        {
          attempts: 3,
          backoff: {
            type: "exponential",
            delay: 5000,
          },
        },
      );

      this.logger.log(`Queued subscription status change notification for customer ${stripeCustomerId}`);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      this.logger.error(`Failed to queue subscription notification for ${stripeCustomerId}: ${errorMsg}`);
    }
  }
}
