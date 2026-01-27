import { Type } from "class-transformer";
import { Equals, IsDefined, IsNotEmpty, IsString, ValidateNested } from "class-validator";
import { totpAuthenticatorMeta } from "../entities/totp-authenticator.meta";

/**
 * Attributes for TOTP setup request.
 */
export class TotpSetupAttributesDTO {
  /**
   * A friendly name for this authenticator (e.g., "Google Authenticator", "Work Phone").
   */
  @IsDefined()
  @IsNotEmpty()
  @IsString()
  name: string;

  /**
   * The account name to display in authenticator apps (typically the user's email).
   */
  @IsDefined()
  @IsNotEmpty()
  @IsString()
  accountName: string;
}

/**
 * Data wrapper for TOTP setup request.
 */
export class TotpSetupDataDTO {
  @Equals(totpAuthenticatorMeta.endpoint)
  type: string;

  @ValidateNested()
  @IsNotEmpty()
  @Type(() => TotpSetupAttributesDTO)
  attributes: TotpSetupAttributesDTO;
}

/**
 * DTO for TOTP setup request.
 *
 * Used when a user initiates TOTP authenticator setup.
 * Returns a QR code and secret for the authenticator app.
 *
 * Endpoint: POST /auth/totp/setup
 */
export class TotpSetupDTO {
  @ValidateNested()
  @IsNotEmpty()
  @Type(() => TotpSetupDataDTO)
  data: TotpSetupDataDTO;
}
