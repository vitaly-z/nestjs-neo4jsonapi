import { Type } from "class-transformer";
import { Equals, IsNotEmpty, IsUUID, ValidateNested } from "class-validator";
import { roleMeta } from "../../role/entities/role.meta";

export class RoleDTO {
  @Equals(roleMeta.endpoint)
  type: string;

  @IsUUID()
  id: string;
}

export class RoleDataDTO {
  @ValidateNested()
  @IsNotEmpty()
  @Type(() => RoleDTO)
  data: RoleDTO;
}

export class RoleDataListDTO {
  @ValidateNested({ each: true })
  @IsNotEmpty()
  @Type(() => RoleDTO)
  data: RoleDTO[];
}
