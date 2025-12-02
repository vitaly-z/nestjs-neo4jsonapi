import { Type } from "class-transformer";
import { Equals, IsDefined, IsNotEmpty, IsString, ValidateNested } from "class-validator";
import { authMeta } from "../../auth/entities/auth.meta";

export class AuthPostResetPasswordAttributesDTO {
  @IsDefined()
  @IsString()
  password: string;
}

export class AuthDataResetPasswordDTO {
  @Equals(authMeta.endpoint)
  type: string;

  @ValidateNested()
  @IsNotEmpty()
  @Type(() => AuthPostResetPasswordAttributesDTO)
  attributes: AuthPostResetPasswordAttributesDTO;
}

export class AuthPostResetPasswordDTO {
  @ValidateNested()
  @IsNotEmpty()
  @Type(() => AuthDataResetPasswordDTO)
  data: AuthDataResetPasswordDTO;
}
