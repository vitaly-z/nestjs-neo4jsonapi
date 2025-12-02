import { Type } from "class-transformer";
import { Equals, IsNotEmpty, IsUUID, ValidateNested } from "class-validator";
import { userMeta } from "../../user/entities/user.meta";

export class UserDTO {
  @Equals(userMeta.endpoint)
  type: string;

  @IsUUID()
  id: string;
}

export class UserDataDTO {
  @ValidateNested()
  @IsNotEmpty()
  @Type(() => UserDTO)
  data: UserDTO;
}

export class UserDataListDTO {
  @ValidateNested({ each: true })
  @IsNotEmpty()
  @Type(() => UserDTO)
  data: UserDTO[];
}
