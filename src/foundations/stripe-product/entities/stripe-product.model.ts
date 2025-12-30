import { DataModelInterface } from "../../../common/interfaces/datamodel.interface";
import { StripeProduct } from "./stripe-product.entity";
import { mapStripeProduct } from "./stripe-product.map";
import { stripeProductMeta } from "./stripe-product.meta";
import { StripeProductSerialiser } from "../serialisers/stripe-product.serialiser";

export const StripeProductModel: DataModelInterface<StripeProduct> = {
  ...stripeProductMeta,
  entity: undefined as unknown as StripeProduct,
  mapper: mapStripeProduct,
  serialiser: StripeProductSerialiser,
  singleChildrenTokens: [],
  childrenTokens: [],
};
