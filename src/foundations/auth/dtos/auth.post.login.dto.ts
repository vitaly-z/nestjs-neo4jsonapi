import { Type } from "class-transformer";
import { Equals, IsDefined, IsEmail, IsNotEmpty, IsString, ValidateNested } from "class-validator";
import { authMeta } from "../../auth/entities/auth.meta";

export class AuthPostLoginAttributesDTO {
  @IsDefined()
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsDefined()
  @IsNotEmpty()
  @IsString()
  password: string;
}

export class AuthPostLoginDataDTO {
  @Equals(authMeta.endpoint)
  type: string;

  @ValidateNested()
  @IsNotEmpty()
  @Type(() => AuthPostLoginAttributesDTO)
  attributes: AuthPostLoginAttributesDTO;
}

export class AuthPostLoginDTO {
  @ValidateNested()
  @IsNotEmpty()
  @Type(() => AuthPostLoginDataDTO)
  data: AuthPostLoginDataDTO;
}
