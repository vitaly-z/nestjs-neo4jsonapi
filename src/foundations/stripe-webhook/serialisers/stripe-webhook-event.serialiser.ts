import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { BaseConfigInterface as ConfigInterface } from "../../../config/interfaces/base.config.interface";
import { AbstractJsonApiSerialiser } from "../../../core/jsonapi";
import { JsonApiSerialiserFactory } from "../../../core/jsonapi";
import { JsonApiDataInterface } from "../../../core/jsonapi";
import { JsonApiServiceInterface } from "../../../core/jsonapi";
import { StripeWebhookEvent } from "../entities/stripe-webhook-event.entity";
import { StripeWebhookEventModel } from "../entities/stripe-webhook-event.model";

@Injectable()
export class StripeWebhookEventSerialiser extends AbstractJsonApiSerialiser implements JsonApiServiceInterface {
  constructor(serialiserFactory: JsonApiSerialiserFactory, config: ConfigService<ConfigInterface>) {
    super(serialiserFactory, config);
  }

  get type(): string {
    return StripeWebhookEventModel.type;
  }

  create(): JsonApiDataInterface {
    this.attributes = {
      stripeEventId: "stripeEventId",
      eventType: "eventType",
      livemode: "livemode",
      apiVersion: "apiVersion",
      status: "status",
      processedAt: (data: StripeWebhookEvent) => data.processedAt?.toISOString(),
      error: "error",
      retryCount: "retryCount",
    };

    this.relationships = {};

    return super.create();
  }
}
