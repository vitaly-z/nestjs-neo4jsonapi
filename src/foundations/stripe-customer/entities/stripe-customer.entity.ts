import { Entity } from "../../../common/abstracts/entity";
import { Company } from "../../company/entities/company.entity";

export type StripeCustomer = Entity & {
  stripeCustomerId: string;
  email: string;
  name: string;
  defaultPaymentMethodId?: string;
  currency: string;
  balance: number;
  delinquent: boolean;

  company: Company;
};
