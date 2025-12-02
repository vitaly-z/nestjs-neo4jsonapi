import { Injectable } from "@nestjs/common";
import { AbstractJsonApiSerialiser } from "../../../core/jsonapi/abstracts/abstract.jsonapi.serialiser";
import { JsonApiDataInterface } from "../../../core/jsonapi/interfaces/jsonapi.data.interface";
import { JsonApiServiceInterface } from "../../../core/jsonapi/interfaces/jsonapi.service.interface";
import { s3Meta } from "../../s3/entities/s3.meta";

@Injectable()
export class S3Serialiser extends AbstractJsonApiSerialiser implements JsonApiServiceInterface {
  get type(): string {
    return s3Meta.endpoint;
  }

  create(): JsonApiDataInterface {
    this.attributes = {
      url: "url",
      storageType: "storageType",
      contentType: "contentType",
      blobType: "blobType",
      acl: "acl",
    };

    return super.create();
  }
}
