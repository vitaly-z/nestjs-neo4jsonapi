import { DataMeta } from "../../../common/interfaces/datamodel.interface";

export const stripeWebhookEventMeta: DataMeta = {
  type: "stripe-webhook-events",
  endpoint: "stripe-webhook-events",
  nodeName: "stripeWebhookEvent",
  labelName: "StripeWebhookEvent",
};
