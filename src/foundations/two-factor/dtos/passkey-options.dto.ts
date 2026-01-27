import { Type } from "class-transformer";
import { Equals, IsDefined, IsNotEmpty, IsOptional, IsString, ValidateNested } from "class-validator";
import { passkeyMeta } from "../entities/passkey.meta";

/**
 * Attributes for passkey registration options request.
 */
export class PasskeyRegistrationOptionsAttributesDTO {
  /**
   * The user's username or email (displayed in the passkey prompt).
   */
  @IsDefined()
  @IsNotEmpty()
  @IsString()
  userName: string;

  /**
   * The user's display name (optional, defaults to userName).
   */
  @IsOptional()
  @IsString()
  userDisplayName?: string;
}

/**
 * Data wrapper for passkey registration options request.
 */
export class PasskeyRegistrationOptionsDataDTO {
  @Equals(passkeyMeta.endpoint)
  type: string;

  @ValidateNested()
  @IsNotEmpty()
  @Type(() => PasskeyRegistrationOptionsAttributesDTO)
  attributes: PasskeyRegistrationOptionsAttributesDTO;
}

/**
 * DTO for passkey registration options request.
 *
 * Used to generate WebAuthn registration options for creating a new passkey.
 * Returns options to be passed to navigator.credentials.create().
 *
 * Endpoint: POST /auth/passkey/register/options
 */
export class PasskeyRegistrationOptionsDTO {
  @ValidateNested()
  @IsNotEmpty()
  @Type(() => PasskeyRegistrationOptionsDataDTO)
  data: PasskeyRegistrationOptionsDataDTO;
}

/**
 * DTO for passkey authentication options request.
 *
 * No attributes needed - uses userId from token.
 * Returns options to be passed to navigator.credentials.get().
 *
 * Endpoint: POST /auth/two-factor/verify/passkey/options
 */
export class PasskeyAuthenticationOptionsDTO {
  // No body required - userId comes from pending token
}
