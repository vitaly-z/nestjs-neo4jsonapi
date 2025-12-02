import { Injectable } from "@nestjs/common";
import { baseConfig } from "../../../config/base.config";
import { JsonApiSerialiserFactory } from "../factories/jsonapi.serialiser.factory";
import { JsonApiDataInterface } from "../interfaces/jsonapi.data.interface";
import { JsonApiServiceInterface } from "../interfaces/jsonapi.service.interface";

@Injectable()
export abstract class AbstractJsonApiSerialiser implements JsonApiServiceInterface {
  private _id: string;
  private _attributes: any = {};
  private readonly apiConfig = baseConfig.api;

  private _meta: any = {
    createdAt: "createdAt",
    updatedAt: "updatedAt",
    recordCount: "recordCount",
  };

  private _links: any = {
    self: (data: any) => {
      return `${this.apiConfig.url}${this.endpoint}/${data[this.id]}`;
    },
  };

  private _relationships: any = {};

  constructor(protected readonly serialiserFactory: JsonApiSerialiserFactory) {
    this._id = "id";
  }

  abstract get type(): string;

  get id(): string {
    return this._id;
  }

  get endpoint(): string {
    return this.type;
  }

  get endpointParameters(): string {
    return "";
  }

  set attributes(attributes: any) {
    this._attributes = attributes;
  }

  set meta(meta: any) {
    this._meta = {
      ...this._meta,
      ...meta,
    };
  }

  set links(links: any) {
    this._links = links;
  }

  set relationships(relationships: any) {
    this._relationships = relationships;
  }

  create(): JsonApiDataInterface {
    return {
      type: this.type,
      id: (data: any) => {
        return data[this.id];
      },
      attributes: this._attributes,
      meta: this._meta,
      relationships: this._relationships,
      links: this._links,
    };
  }
}
