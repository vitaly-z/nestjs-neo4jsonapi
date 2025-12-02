import { Type } from "class-transformer";
import { Equals, IsDefined, IsEmail, IsNotEmpty, ValidateNested } from "class-validator";
import { authMeta } from "../../auth/entities/auth.meta";

export class AuthPostOnly35AttributesDTO {
  @IsDefined()
  @IsEmail()
  email: string;

  @IsDefined()
  @IsEmail()
  token: string;
}

export class AuthPostOnly35DataDTO {
  @Equals(authMeta.endpoint)
  type: string;

  @ValidateNested()
  @IsNotEmpty()
  @Type(() => AuthPostOnly35AttributesDTO)
  attributes: AuthPostOnly35AttributesDTO;
}

export class AuthPostOnly35DTO {
  @ValidateNested()
  @IsNotEmpty()
  @Type(() => AuthPostOnly35DataDTO)
  data: AuthPostOnly35DataDTO;
}
