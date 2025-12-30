import { Entity } from "../../../common/abstracts/entity";

export type StripeProduct = Entity & {
  stripeProductId: string;
  name: string;
  description?: string;
  active: boolean;
  metadata?: string;
};
