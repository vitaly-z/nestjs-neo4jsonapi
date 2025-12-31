import { Injectable } from "@nestjs/common";
import Stripe from "stripe";
import { StripeService } from "../../stripe/services/stripe.service";
import { AppLoggingService } from "../../../core/logging/services/logging.service";

export interface WebhookEventData {
  id: string;
  type: string;
  livemode: boolean;
  created: Date;
  data: Stripe.Event.Data;
  apiVersion: string | null;
}

/**
 * StripeWebhookService
 *
 * Handles Stripe webhook event verification and parsing. Provides utilities to validate
 * webhook signatures, extract event data, and categorize events by type.
 */
@Injectable()
export class StripeWebhookService {
  constructor(
    private readonly stripeService: StripeService,
    private readonly logger: AppLoggingService,
  ) {}

  /**
   * Construct and verify a Stripe webhook event
   */
  constructEvent(payload: Buffer, signature: string): Stripe.Event {
    const stripe = this.stripeService.getClient();
    const webhookSecret = this.stripeService.getWebhookSecret();

    if (!webhookSecret) {
      throw new Error("Webhook secret not configured");
    }

    return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  }

  /**
   * Parse a Stripe event into a structured format
   */
  parseEvent(event: Stripe.Event): WebhookEventData {
    return {
      id: event.id,
      type: event.type,
      livemode: event.livemode,
      created: new Date(event.created * 1000),
      data: event.data,
      apiVersion: event.api_version,
    };
  }

  /**
   * Extract the event object with proper typing
   */
  getEventObject<T = Stripe.Event.Data.Object>(event: Stripe.Event): T {
    return event.data.object as T;
  }

  /**
   * Check if event is subscription-related
   */
  isSubscriptionEvent(eventType: string): boolean {
    return eventType.startsWith("customer.subscription.");
  }

  /**
   * Check if event is invoice-related
   */
  isInvoiceEvent(eventType: string): boolean {
    return eventType.startsWith("invoice.");
  }

  /**
   * Check if event is payment-related
   */
  isPaymentEvent(eventType: string): boolean {
    return (
      eventType.startsWith("payment_intent.") ||
      eventType.startsWith("payment_method.") ||
      eventType.startsWith("charge.")
    );
  }

  /**
   * Check if event is customer-related (excluding subscriptions)
   */
  isCustomerEvent(eventType: string): boolean {
    return eventType.startsWith("customer.") && !this.isSubscriptionEvent(eventType);
  }
}
