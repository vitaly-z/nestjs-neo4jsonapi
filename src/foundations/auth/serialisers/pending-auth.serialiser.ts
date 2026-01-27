import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { BaseConfigInterface } from "../../../config/interfaces";
import { AbstractJsonApiSerialiser } from "../../../core/jsonapi/abstracts/abstract.jsonapi.serialiser";
import { JsonApiSerialiserFactory } from "../../../core/jsonapi/factories/jsonapi.serialiser.factory";
import { JsonApiDataInterface } from "../../../core/jsonapi/interfaces/jsonapi.data.interface";
import { JsonApiServiceInterface } from "../../../core/jsonapi/interfaces/jsonapi.service.interface";
import { pendingAuthMeta } from "../../auth/entities/pending-auth.meta";

/**
 * Serialiser for PendingAuth responses.
 * Used when a user with 2FA enabled successfully authenticates
 * with password and needs to complete 2FA verification.
 */
@Injectable()
export class PendingAuthSerialiser extends AbstractJsonApiSerialiser implements JsonApiServiceInterface {
  constructor(serialiserFactory: JsonApiSerialiserFactory, configService: ConfigService<BaseConfigInterface>) {
    super(serialiserFactory, configService);
  }

  get type(): string {
    return pendingAuthMeta.endpoint;
  }

  get endpoint(): string {
    return `auth/two-factor/challenge`;
  }

  create(): JsonApiDataInterface {
    this.attributes = {
      pendingId: "pendingId",
      token: "token",
      expiration: "expiration",
      availableMethods: "availableMethods",
      preferredMethod: "preferredMethod",
    };

    // No relationships needed for pending auth

    return super.create();
  }
}
