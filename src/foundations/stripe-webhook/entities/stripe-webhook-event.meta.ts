import { DataMeta } from "../../../common/interfaces/datamodel.interface";

export const stripeWebhookEventMeta: DataMeta = {
  type: "stripe-webhook",
  endpoint: "stripe-webhooks",
  nodeName: "stripeWebhookEvent",
  labelName: "StripeWebhookEvent",
};
