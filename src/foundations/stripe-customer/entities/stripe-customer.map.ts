import { mapEntity } from "../../../common/abstracts/entity";
import { EntityFactory } from "../../../core/neo4j/factories/entity.factory";
import { StripeCustomer } from "./stripe-customer.entity";

export const mapStripeCustomer = (params: { data: any; record: any; entityFactory: EntityFactory }): StripeCustomer => {
  return {
    ...mapEntity({ record: params.data }),
    stripeCustomerId: params.data.stripeCustomerId,
    email: params.data.email,
    name: params.data.name,
    defaultPaymentMethodId: params.data.defaultPaymentMethodId,
    currency: params.data.currency,
    balance: Number(params.data.balance ?? 0),
    delinquent: params.data.delinquent === true,
    company: undefined,
  };
};
