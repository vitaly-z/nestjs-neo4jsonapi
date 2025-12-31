import { Entity } from "../../../common/abstracts/entity";

export type StripeWebhookEventStatus = "pending" | "processing" | "completed" | "failed";

export type StripeWebhookEvent = Entity & {
  stripeEventId: string;
  eventType: string;
  livemode: boolean;
  apiVersion: string | null;
  status: StripeWebhookEventStatus;
  payload: Record<string, any>;
  processedAt?: Date;
  error?: string;
  retryCount: number;
};
