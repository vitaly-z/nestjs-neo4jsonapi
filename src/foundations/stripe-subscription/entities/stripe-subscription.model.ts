import { DataModelInterface } from "../../../common/interfaces/datamodel.interface";
import { stripeCustomerMeta } from "../../stripe-customer/entities/stripe-customer.meta";
import { stripePriceMeta } from "../../stripe-price/entities/stripe-price.meta";
import { StripeSubscription } from "./stripe-subscription.entity";
import { mapStripeSubscription } from "./stripe-subscription.map";
import { stripeSubscriptionMeta } from "./stripe-subscription.meta";
import { StripeSubscriptionSerialiser } from "../serialisers/stripe-subscription.serialiser";

export const StripeSubscriptionModel: DataModelInterface<StripeSubscription> = {
  ...stripeSubscriptionMeta,
  entity: undefined as unknown as StripeSubscription,
  mapper: mapStripeSubscription,
  serialiser: StripeSubscriptionSerialiser,
  singleChildrenTokens: [stripeCustomerMeta.nodeName, stripePriceMeta.nodeName],
  childrenTokens: [],
};
