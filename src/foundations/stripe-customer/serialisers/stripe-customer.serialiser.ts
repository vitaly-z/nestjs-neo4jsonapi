import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { BaseConfigInterface as ConfigInterface } from "../../../config/interfaces/base.config.interface";
import { AbstractJsonApiSerialiser } from "../../../core/jsonapi";
import { JsonApiSerialiserFactory } from "../../../core/jsonapi";
import { JsonApiDataInterface } from "../../../core/jsonapi";
import { JsonApiServiceInterface } from "../../../core/jsonapi";
import { StripeCustomer } from "../entities/stripe-customer.entity";
import { StripeCustomerModel } from "../entities/stripe-customer.model";

@Injectable()
export class StripeCustomerSerialiser extends AbstractJsonApiSerialiser implements JsonApiServiceInterface {
  constructor(serialiserFactory: JsonApiSerialiserFactory, config: ConfigService<ConfigInterface>) {
    super(serialiserFactory, config);
  }

  get type(): string {
    return StripeCustomerModel.type;
  }

  create(): JsonApiDataInterface {
    this.attributes = {
      stripeCustomerId: "stripeCustomerId",
      email: "email",
      name: "name",
      defaultPaymentMethodId: "defaultPaymentMethodId",
      currency: "currency",
      balance: (data: StripeCustomer) => Number(data.balance ?? 0),
      delinquent: "delinquent",
    };

    return super.create();
  }
}
