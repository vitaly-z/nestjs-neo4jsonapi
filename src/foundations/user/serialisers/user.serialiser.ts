import { User } from "../../user/entities/user.entity";

import { Injectable } from "@nestjs/common";
import { AbstractJsonApiSerialiser } from "../../../core/jsonapi/abstracts/abstract.jsonapi.serialiser";
import { JsonApiSerialiserFactory } from "../../../core/jsonapi/factories/jsonapi.serialiser.factory";
import { JsonApiDataInterface } from "../../../core/jsonapi/interfaces/jsonapi.data.interface";
import { JsonApiServiceInterface } from "../../../core/jsonapi/interfaces/jsonapi.service.interface";
import { CompanyModel } from "../../company/entities/company.model";
import { ModuleModel } from "../../module/entities/module.model";
import { RoleModel } from "../../role/entities/role.model";
import { S3Service } from "../../s3/services/s3.service";
import { userMeta } from "../../user/entities/user.meta";

@Injectable()
export class UserSerialiser extends AbstractJsonApiSerialiser implements JsonApiServiceInterface {
  constructor(
    serialiserFactory: JsonApiSerialiserFactory,
    private readonly s3Service: S3Service,
  ) {
    super(serialiserFactory);
  }

  get type(): string {
    return userMeta.endpoint;
  }

  create(): JsonApiDataInterface {
    this.attributes = {
      username: "username",
      name: "name",
      title: "title",
      bio: "bio",
      email: "email",
      avatar: async (data: User) => {
        if (!data.avatar) return undefined;
        if (data.avatar.startsWith("~")) return data.avatar.substring(1);
        return await this.s3Service.generateSignedUrl({ key: data.avatar, isPublic: true });
      },
      avatarUrl: (data: User) => {
        if (!data.avatar) return undefined;
        return data.avatar;
      },
      phone: "phone",
      rate: "rate",
    };

    this.meta = {
      isActive: "isActive",
      isDeleted: "isDeleted",
      lastLogin: "lastLogin",
    };

    this.relationships = {
      role: {
        name: `roles`,
        data: this.serialiserFactory.create(RoleModel),
      },
      company: {
        data: this.serialiserFactory.create(CompanyModel),
      },
      module: {
        name: `modules`,
        data: this.serialiserFactory.create(ModuleModel),
      },
    };

    return super.create();
  }
}
