import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { BaseConfigInterface as ConfigInterface } from "../../../config/interfaces/base.config.interface";
import {
  AbstractJsonApiSerialiser,
  JsonApiDataInterface,
  JsonApiSerialiserFactory,
  JsonApiServiceInterface,
} from "../../../core/jsonapi";
import { stripePaymentMethodMeta } from "../entities/stripe-payment-method.meta";

/**
 * StripePaymentMethodSerialiser
 *
 * Serializes payment method data into JSON:API format.
 * Payment methods are fetched from Stripe and serialized for the frontend.
 */
@Injectable()
export class StripePaymentMethodSerialiser extends AbstractJsonApiSerialiser implements JsonApiServiceInterface {
  constructor(serialiserFactory: JsonApiSerialiserFactory, config: ConfigService<ConfigInterface>) {
    super(serialiserFactory, config);
  }

  get type(): string {
    return stripePaymentMethodMeta.type;
  }

  create(): JsonApiDataInterface {
    this.attributes = {
      type: "type",
      brand: "brand",
      last4: "last4",
      expMonth: "expMonth",
      expYear: "expYear",
      billingName: "billingName",
      billingEmail: "billingEmail",
      billingPhone: "billingPhone",
      billingAddressCity: "billingAddressCity",
      billingAddressCountry: "billingAddressCountry",
      billingAddressLine1: "billingAddressLine1",
      billingAddressLine2: "billingAddressLine2",
      billingAddressPostalCode: "billingAddressPostalCode",
      billingAddressState: "billingAddressState",
    };

    return super.create();
  }
}
