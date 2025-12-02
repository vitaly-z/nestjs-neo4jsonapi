import { Type } from "class-transformer";
import { Equals, IsDefined, IsNotEmpty, IsOptional, IsString, IsUUID, ValidateNested } from "class-validator";
import { companyMeta } from "../../company/entities/company.meta";

export class CompanyLicensePutAttributesDTO {
  @IsDefined()
  @IsString()
  license: string;

  @IsDefined()
  @IsString()
  privateKey: string;
}

export class CompanyLicensePutDataDTO {
  @Equals(companyMeta.endpoint)
  type: string;

  @IsUUID()
  id: string;

  @ValidateNested({ each: true })
  @IsNotEmpty()
  @Type(() => CompanyLicensePutAttributesDTO)
  attributes: CompanyLicensePutAttributesDTO;
}

export class CompanyLicensePutDTO {
  @ValidateNested()
  @IsNotEmpty()
  @Type(() => CompanyLicensePutDataDTO)
  data: CompanyLicensePutDataDTO;

  @IsOptional()
  included: any[];
}
