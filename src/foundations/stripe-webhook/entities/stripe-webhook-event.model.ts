import { DataModelInterface } from "../../../common/interfaces/datamodel.interface";
import { StripeWebhookEvent } from "./stripe-webhook-event.entity";
import { mapStripeWebhookEvent } from "./stripe-webhook-event.map";
import { stripeWebhookEventMeta } from "./stripe-webhook-event.meta";
import { StripeWebhookEventSerialiser } from "../serialisers/stripe-webhook-event.serialiser";

export const StripeWebhookEventModel: DataModelInterface<StripeWebhookEvent> = {
  ...stripeWebhookEventMeta,
  entity: undefined as unknown as StripeWebhookEvent,
  mapper: mapStripeWebhookEvent,
  serialiser: StripeWebhookEventSerialiser,
  singleChildrenTokens: [],
  childrenTokens: [],
};
