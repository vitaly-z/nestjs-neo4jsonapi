import { Injectable } from "@nestjs/common";
import { AbstractJsonApiSerialiser } from "../../../core/jsonapi/abstracts/abstract.jsonapi.serialiser";
import { JsonApiDataInterface } from "../../../core/jsonapi/interfaces/jsonapi.data.interface";
import { JsonApiServiceInterface } from "../../../core/jsonapi/interfaces/jsonapi.service.interface";
import { FeatureModel } from "../../feature/entities/feature.model";
import { roleMeta } from "../../role/entities/role.meta";

@Injectable()
export class RoleSerialiser extends AbstractJsonApiSerialiser implements JsonApiServiceInterface {
  get type(): string {
    return roleMeta.endpoint;
  }

  create(): JsonApiDataInterface {
    this.attributes = {
      name: "name",
      description: "description",
      isSelectable: "isSelectable",
    };

    this.relationships = {
      feature: {
        name: `requiredFeature`,
        data: this.serialiserFactory.create(FeatureModel),
      },
    };

    return super.create();
  }
}
