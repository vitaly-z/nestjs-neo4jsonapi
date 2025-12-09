import { Type } from "class-transformer";
import { Equals, IsDefined, IsNotEmpty, IsOptional, IsString, IsUUID, ValidateNested } from "class-validator";
import { companyMeta } from "../../company/entities/company.meta";

export class CompanyConfigurationsPutAttributesDTO {
  @IsDefined()
  @IsString()
  configurations: string;
}

export class CompanyConfigurationsPutDataDTO {
  @Equals(companyMeta.endpoint)
  type: string;

  @IsUUID()
  id: string;

  @ValidateNested({ each: true })
  @IsNotEmpty()
  @Type(() => CompanyConfigurationsPutAttributesDTO)
  attributes: CompanyConfigurationsPutAttributesDTO;
}

export class CompanyConfigurationsPutDTO {
  @ValidateNested()
  @IsNotEmpty()
  @Type(() => CompanyConfigurationsPutDataDTO)
  data: CompanyConfigurationsPutDataDTO;

  @IsOptional()
  included: any[];
}
