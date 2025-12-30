import { DataModelInterface } from "../../../common/interfaces/datamodel.interface";
import { billingCustomerMeta } from "../entities/billing-customer.meta";
import { stripePriceMeta } from "../../stripe-price/entities/stripe-price.meta";
import { Subscription } from "../entities/subscription.entity";
import { mapSubscription } from "../entities/subscription.map";
import { subscriptionMeta } from "../entities/subscription.meta";
import { SubscriptionSerialiser } from "../serialisers/subscription.serialiser";

export const SubscriptionModel: DataModelInterface<Subscription> = {
  ...subscriptionMeta,
  entity: undefined as unknown as Subscription,
  mapper: mapSubscription,
  serialiser: SubscriptionSerialiser,
  singleChildrenTokens: [billingCustomerMeta.nodeName, stripePriceMeta.nodeName],
  childrenTokens: [],
};
