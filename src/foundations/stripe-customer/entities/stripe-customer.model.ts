import { DataModelInterface } from "../../../common/interfaces/datamodel.interface";
import { companyMeta } from "../../company";
import { StripeCustomer } from "./stripe-customer.entity";
import { mapStripeCustomer } from "./stripe-customer.map";
import { stripeCustomerMeta } from "./stripe-customer.meta";
import { StripeCustomerSerialiser } from "../serialisers/stripe-customer.serialiser";

export const StripeCustomerModel: DataModelInterface<StripeCustomer> = {
  ...stripeCustomerMeta,
  entity: undefined as unknown as StripeCustomer,
  mapper: mapStripeCustomer,
  serialiser: StripeCustomerSerialiser,
  singleChildrenTokens: [companyMeta.nodeName],
  childrenTokens: [],
};
