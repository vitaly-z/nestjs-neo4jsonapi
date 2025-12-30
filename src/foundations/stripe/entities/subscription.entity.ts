import { Entity } from "../../../common/abstracts/entity";
import { BillingCustomer } from "../entities/billing-customer.entity";
import { StripePrice } from "../../stripe-price/entities/stripe-price.entity";

export type SubscriptionStatus =
  | "active"
  | "past_due"
  | "unpaid"
  | "canceled"
  | "incomplete"
  | "incomplete_expired"
  | "trialing"
  | "paused";

export type Subscription = Entity & {
  stripeSubscriptionId: string;
  stripeSubscriptionItemId?: string;

  status: SubscriptionStatus;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  canceledAt?: Date;

  trialStart?: Date;
  trialEnd?: Date;
  pausedAt?: Date;

  quantity: number;

  billingCustomer: BillingCustomer;
  price: StripePrice;
};
