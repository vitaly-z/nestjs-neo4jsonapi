import { DataModelInterface } from "../../../common/interfaces/datamodel.interface";
import { StripeProduct } from "../entities/stripe-product.entity";
import { mapStripeProduct } from "../entities/stripe-product.map";
import { stripeProductMeta } from "../entities/stripe-product.meta";
import { StripeProductSerialiser } from "../serialisers/stripe-product.serialiser";

export const StripeProductModel: DataModelInterface<StripeProduct> = {
  ...stripeProductMeta,
  entity: undefined as unknown as StripeProduct,
  mapper: mapStripeProduct,
  serialiser: StripeProductSerialiser,
  singleChildrenTokens: [],
  childrenTokens: [],
};
