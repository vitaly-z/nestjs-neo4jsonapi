import { Type } from "class-transformer";
import { Equals, IsNotEmpty, IsUUID, ValidateNested } from "class-validator";
import { companyMeta } from "../../company/entities/company.meta";

export class CompanyDTO {
  @Equals(companyMeta.endpoint)
  type: string;

  @IsUUID()
  id: string;
}

export class CompanyDataDTO {
  @ValidateNested()
  @IsNotEmpty()
  @Type(() => CompanyDTO)
  data: CompanyDTO;
}

export class CompanyDataListDTO {
  @ValidateNested({ each: true })
  @IsNotEmpty()
  @Type(() => CompanyDTO)
  data: CompanyDTO[];
}
