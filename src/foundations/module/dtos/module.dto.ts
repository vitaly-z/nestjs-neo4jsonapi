import { Type } from "class-transformer";
import { Equals, IsNotEmpty, IsUUID, ValidateNested } from "class-validator";
import { moduleMeta } from "../../module/entities/module.meta";

export class ModuleDTO {
  @Equals(moduleMeta.endpoint)
  type: string;

  @IsUUID()
  id: string;
}

export class ModuleDataDTO {
  @ValidateNested()
  @IsNotEmpty()
  @Type(() => ModuleDTO)
  data: ModuleDTO;
}

export class ModuleDataListDTO {
  @ValidateNested({ each: true })
  @IsNotEmpty()
  @Type(() => ModuleDTO)
  data: ModuleDTO[];
}
