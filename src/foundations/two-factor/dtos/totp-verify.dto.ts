import { Type } from "class-transformer";
import {
  Equals,
  IsDefined,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
  ValidateNested,
} from "class-validator";
import { totpAuthenticatorMeta } from "../entities/totp-authenticator.meta";

/**
 * Attributes for TOTP setup verification request.
 */
export class TotpSetupVerifyAttributesDTO {
  /**
   * The authenticator ID returned from the setup endpoint.
   */
  @IsDefined()
  @IsUUID()
  authenticatorId: string;

  /**
   * The 6-digit TOTP code from the authenticator app.
   */
  @IsDefined()
  @IsNotEmpty()
  @IsString()
  @Length(6, 6, { message: "TOTP code must be exactly 6 digits" })
  @Matches(/^\d{6}$/, { message: "TOTP code must contain only digits" })
  code: string;
}

/**
 * Data wrapper for TOTP setup verification request.
 */
export class TotpSetupVerifyDataDTO {
  @Equals(totpAuthenticatorMeta.endpoint)
  type: string;

  @ValidateNested()
  @IsNotEmpty()
  @Type(() => TotpSetupVerifyAttributesDTO)
  attributes: TotpSetupVerifyAttributesDTO;
}

/**
 * DTO for TOTP setup verification request.
 *
 * Used to verify and activate a newly set up TOTP authenticator.
 *
 * Endpoint: POST /auth/totp/verify-setup
 */
export class TotpSetupVerifyDTO {
  @ValidateNested()
  @IsNotEmpty()
  @Type(() => TotpSetupVerifyDataDTO)
  data: TotpSetupVerifyDataDTO;
}

/**
 * Attributes for TOTP verification during 2FA login flow.
 */
export class TotpVerifyAttributesDTO {
  /**
   * The 6-digit TOTP code from the authenticator app.
   */
  @IsDefined()
  @IsNotEmpty()
  @IsString()
  @Length(6, 6, { message: "TOTP code must be exactly 6 digits" })
  @Matches(/^\d{6}$/, { message: "TOTP code must contain only digits" })
  code: string;

  /**
   * Optional: specific authenticator ID to use for verification.
   * If not provided, all user's verified authenticators are checked.
   */
  @IsOptional()
  @IsUUID()
  authenticatorId?: string;
}

/**
 * Data wrapper for TOTP verification during login.
 */
export class TotpVerifyDataDTO {
  @Equals(totpAuthenticatorMeta.endpoint)
  type: string;

  @ValidateNested()
  @IsNotEmpty()
  @Type(() => TotpVerifyAttributesDTO)
  attributes: TotpVerifyAttributesDTO;
}

/**
 * DTO for TOTP verification during 2FA login flow.
 *
 * Used when a user provides a TOTP code to complete two-factor authentication.
 *
 * Endpoint: POST /auth/two-factor/verify/totp
 */
export class TotpVerifyDTO {
  @ValidateNested()
  @IsNotEmpty()
  @Type(() => TotpVerifyDataDTO)
  data: TotpVerifyDataDTO;
}
