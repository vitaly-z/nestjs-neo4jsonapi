import { Type } from "class-transformer";
import { Equals, IsDefined, IsEmail, IsNotEmpty, IsString, IsUUID, ValidateNested } from "class-validator";
import { authMeta } from "../../auth/entities/auth.meta";

export class AuthPostRegisterAttributesDTO {
  @IsDefined()
  @IsString()
  name: string;

  @IsDefined()
  @IsEmail()
  email: string;

  @IsDefined()
  @IsString()
  password: string;
}

export class AuthPostRegisterDataDTO {
  @Equals(authMeta.endpoint)
  type: string;

  @IsUUID()
  id: string;

  @ValidateNested()
  @IsNotEmpty()
  @Type(() => AuthPostRegisterAttributesDTO)
  attributes: AuthPostRegisterAttributesDTO;
}

export class AuthPostRegisterDTO {
  @ValidateNested()
  @IsNotEmpty()
  @Type(() => AuthPostRegisterDataDTO)
  data: AuthPostRegisterDataDTO;
}
