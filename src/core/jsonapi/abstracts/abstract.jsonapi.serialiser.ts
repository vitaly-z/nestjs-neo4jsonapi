import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { BaseConfigInterface, ConfigApiInterface } from "../../../config/interfaces";
import { JsonApiSerialiserFactory } from "../factories/jsonapi.serialiser.factory";
import { JsonApiDataInterface } from "../interfaces/jsonapi.data.interface";
import { JsonApiServiceInterface } from "../interfaces/jsonapi.service.interface";

@Injectable()
export abstract class AbstractJsonApiSerialiser implements JsonApiServiceInterface {
  private _id: string;
  private _attributes: any = {};
  private readonly apiConfig: ConfigApiInterface;

  private _meta: any = {
    createdAt: "createdAt",
    updatedAt: "updatedAt",
    recordCount: "recordCount",
  };

  private _links: any;

  private _relationships: any = {};

  constructor(
    protected readonly serialiserFactory: JsonApiSerialiserFactory,
    protected readonly configService: ConfigService<BaseConfigInterface>,
  ) {
    this._id = "id";
    this.apiConfig = this.configService.get<ConfigApiInterface>("api");
    this._links = {
      self: (data: any) => {
        return `${this.apiConfig.url}${this.endpoint}/${data[this.id]}`;
      },
    };
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

  get relationships(): any {
    return this._relationships;
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
