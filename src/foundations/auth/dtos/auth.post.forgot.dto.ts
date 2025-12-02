import { Type } from "class-transformer";
import { Equals, IsDefined, IsEmail, IsNotEmpty, ValidateNested } from "class-validator";
import { authMeta } from "../../auth/entities/auth.meta";

export class AuthPostForgotAttributesDTO {
  @IsDefined()
  @IsEmail()
  email: string;
}

export class AuthPostForgotDataDTO {
  @Equals(authMeta.endpoint)
  type: string;

  @ValidateNested()
  @IsNotEmpty()
  @Type(() => AuthPostForgotAttributesDTO)
  attributes: AuthPostForgotAttributesDTO;
}

export class AuthPostForgotDTO {
  @ValidateNested()
  @IsNotEmpty()
  @Type(() => AuthPostForgotDataDTO)
  data: AuthPostForgotDataDTO;
}
