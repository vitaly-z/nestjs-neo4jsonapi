import { Injectable } from "@nestjs/common";
import { AbstractJsonApiSerialiser } from "../../../core/jsonapi/abstracts/abstract.jsonapi.serialiser";
import { JsonApiDataInterface } from "../../../core/jsonapi/interfaces/jsonapi.data.interface";
import { JsonApiServiceInterface } from "../../../core/jsonapi/interfaces/jsonapi.service.interface";
import { ContentModel } from "../../content/entities/content.model";
import { AuthorModel, OwnerModel } from "../../user/entities/user.model";

@Injectable()
export class ContentSerialiser extends AbstractJsonApiSerialiser implements JsonApiServiceInterface {
  get type(): string {
    return ContentModel.endpoint;
  }

  create(): JsonApiDataInterface {
    this.attributes = {
      name: "name",
      abstract: "abstract",
      tldr: "tldr",
    };

    this.meta = {
      aiStatus: "aiStatus",
      relevance: "relevance",
      contentType: "contentType",
    };

    this.relationships = {
      owner: {
        data: this.serialiserFactory.create(OwnerModel),
      },
      author: {
        data: this.serialiserFactory.create(AuthorModel),
      },
    };

    return super.create();
  }
}
