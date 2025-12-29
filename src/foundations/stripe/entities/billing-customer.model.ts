import { DataModelInterface } from "../../../common/interfaces/datamodel.interface";
import { companyMeta } from "../../company";
import { BillingCustomer } from "../entities/billing-customer.entity";
import { mapBillingCustomer } from "../entities/billing-customer.map";
import { billingCustomerMeta } from "../entities/billing-customer.meta";
import { BillingCustomerSerialiser } from "../serialisers/billing-customer.serialiser";

export const BillingCustomerModel: DataModelInterface<BillingCustomer> = {
  ...billingCustomerMeta,
  entity: undefined as unknown as BillingCustomer,
  mapper: mapBillingCustomer,
  serialiser: BillingCustomerSerialiser,
  singleChildrenTokens: [companyMeta.nodeName],
  childrenTokens: [],
};
