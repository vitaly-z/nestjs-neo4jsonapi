import { DataModelInterface } from "../../../common/interfaces/datamodel.interface";
import { stripeSubscriptionMeta } from "../../stripe-subscription/entities/stripe-subscription.meta";
import { StripeUsageRecord } from "./stripe-usage-record.entity";
import { mapStripeUsageRecord } from "./stripe-usage-record.map";
import { stripeUsageRecordMeta } from "./stripe-usage-record.meta";
import { StripeUsageRecordSerialiser } from "../serialisers/stripe-usage-record.serialiser";

export const StripeUsageRecordModel: DataModelInterface<StripeUsageRecord> = {
  ...stripeUsageRecordMeta,
  entity: undefined as unknown as StripeUsageRecord,
  mapper: mapStripeUsageRecord,
  serialiser: StripeUsageRecordSerialiser,
  singleChildrenTokens: [stripeSubscriptionMeta.nodeName],
  childrenTokens: [],
};
