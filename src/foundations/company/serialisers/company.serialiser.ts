import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { BaseConfigInterface } from "../../../config/interfaces";
import { AbstractJsonApiSerialiser } from "../../../core/jsonapi/abstracts/abstract.jsonapi.serialiser";
import { JsonApiSerialiserFactory } from "../../../core/jsonapi/factories/jsonapi.serialiser.factory";
import { JsonApiDataInterface } from "../../../core/jsonapi/interfaces/jsonapi.data.interface";
import { JsonApiServiceInterface } from "../../../core/jsonapi/interfaces/jsonapi.service.interface";
import { Company } from "../../company/entities/company.entity";
import { companyMeta } from "../../company/entities/company.meta";
import { FeatureModel } from "../../feature/entities/feature.model";
import { ModuleModel } from "../../module/entities/module.model";
import { S3Service } from "../../s3/services/s3.service";

@Injectable()
export class CompanySerialiser extends AbstractJsonApiSerialiser implements JsonApiServiceInterface {
  constructor(
    serialiserFactory: JsonApiSerialiserFactory,
    protected readonly s3Service: S3Service,
    private readonly configService: ConfigService<BaseConfigInterface>,
  ) {
    super(serialiserFactory);
  }

  get type(): string {
    return companyMeta.endpoint;
  }

  create(): JsonApiDataInterface {
    this.attributes = {
      name: "name",
      logoUrl: "logo",
      logo: async (data: Company) => {
        if (!data.logo) return undefined;

        return await this.s3Service.generateSignedUrl({ key: data.logo, isPublic: true });
      },
      availableTokens: async (data: Company) => {
        if (data.availableTokens === undefined) return 0;
        return Number(data.availableTokens);
      },
      licenseExpirationDate: (data: Company) => data.licenseExpirationDate?.toISOString(),
    };

    const companyConfigurationModel = this.configService.get("companyConfigurationModel");

    this.relationships = {
      feature: {
        name: `features`,
        data: this.serialiserFactory.create(FeatureModel),
      },
      module: {
        name: `modules`,
        data: this.serialiserFactory.create(ModuleModel),
      },
      ...(companyConfigurationModel && {
        configuration: {
          name: `configurations`,
          data: this.serialiserFactory.create(companyConfigurationModel),
        },
      }),
    };

    return super.create();
  }
}
