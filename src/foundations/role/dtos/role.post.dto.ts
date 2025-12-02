import { Type } from "class-transformer";
import { Equals, IsDefined, IsNotEmpty, IsOptional, IsString, IsUUID, ValidateNested } from "class-validator";

import { CompanyPostDataDTO } from "../../company/dtos/company.post.dto";
import { roleMeta } from "../../role/entities/role.meta";

export class RolePostAttributesDTO {
  @IsString()
  @IsDefined()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class RolePostDataDTO {
  @Equals(roleMeta.endpoint)
  type: string;

  @IsUUID()
  id: string;

  @ValidateNested()
  @IsNotEmpty()
  @Type(() => RolePostAttributesDTO)
  attributes: RolePostAttributesDTO;
}

export class RolePostDTO {
  @ValidateNested()
  @IsNotEmpty()
  @Type(() => RolePostDataDTO)
  data: RolePostDataDTO;

  @IsOptional()
  included: CompanyPostDataDTO[];
}
