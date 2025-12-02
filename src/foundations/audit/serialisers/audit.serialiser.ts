import { Injectable } from "@nestjs/common";
import { AbstractJsonApiSerialiser } from "../../../core/jsonapi/abstracts/abstract.jsonapi.serialiser";
import { DynamicRelationshipFactory } from "../../../core/jsonapi/factories/dynamic.relationship.factory";
import { JsonApiSerialiserFactory } from "../../../core/jsonapi/factories/jsonapi.serialiser.factory";
import { JsonApiDataInterface } from "../../../core/jsonapi/interfaces/jsonapi.data.interface";
import { JsonApiServiceInterface } from "../../../core/jsonapi/interfaces/jsonapi.service.interface";
import { auditMeta } from "../../audit/entities/audit.meta";
import { UserModel } from "../../user/entities/user.model";

@Injectable()
export class AuditSerialiser extends AbstractJsonApiSerialiser implements JsonApiServiceInterface {
  constructor(
    protected readonly serialiserFactory: JsonApiSerialiserFactory,
    private readonly dynamicRelationshipFactory: DynamicRelationshipFactory,
  ) {
    super(serialiserFactory);
  }

  get type(): string {
    return auditMeta.endpoint;
  }

  create(): JsonApiDataInterface {
    this.attributes = {
      auditType: "auditType",
    };

    const dynamicRel = this.dynamicRelationshipFactory.createDynamicRelationship(null);

    this.relationships = {
      user: {
        data: this.serialiserFactory.create(UserModel),
      },
      audited: {
        data: dynamicRel,
        dynamicFactory: this.dynamicRelationshipFactory,
      },
    };

    return super.create();
  }
}
