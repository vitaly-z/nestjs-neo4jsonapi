import { Type } from "class-transformer";
import { Equals, IsDefined, IsNotEmpty, IsObject, IsOptional, IsString, IsUUID, ValidateNested } from "class-validator";
import { passkeyMeta } from "../entities/passkey.meta";

/**
 * WebAuthn registration response structure.
 * This is a simplified representation - the actual response is more complex.
 */
export class WebAuthnRegistrationResponseDTO {
  @IsDefined()
  @IsString()
  id: string;

  @IsDefined()
  @IsString()
  rawId: string;

  @IsDefined()
  @IsObject()
  response: {
    clientDataJSON: string;
    attestationObject: string;
    transports?: string[];
  };

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  authenticatorAttachment?: string;
}

/**
 * Attributes for passkey registration verification request.
 */
export class PasskeyRegistrationVerifyAttributesDTO {
  /**
   * The pending challenge ID returned from registration options.
   */
  @IsDefined()
  @IsUUID()
  pendingId: string;

  /**
   * A friendly name for this passkey (e.g., "MacBook Pro", "Work Laptop").
   */
  @IsDefined()
  @IsNotEmpty()
  @IsString()
  name: string;

  /**
   * The WebAuthn registration response from navigator.credentials.create().
   */
  @IsDefined()
  @ValidateNested()
  @Type(() => WebAuthnRegistrationResponseDTO)
  response: WebAuthnRegistrationResponseDTO;
}

/**
 * Data wrapper for passkey registration verification request.
 */
export class PasskeyRegistrationVerifyDataDTO {
  @Equals(passkeyMeta.endpoint)
  type: string;

  @ValidateNested()
  @IsNotEmpty()
  @Type(() => PasskeyRegistrationVerifyAttributesDTO)
  attributes: PasskeyRegistrationVerifyAttributesDTO;
}

/**
 * DTO for passkey registration verification request.
 *
 * Used to verify and register a new passkey after the user completes
 * the WebAuthn ceremony on their device.
 *
 * Endpoint: POST /auth/passkey/register/verify
 */
export class PasskeyRegistrationVerifyDTO {
  @ValidateNested()
  @IsNotEmpty()
  @Type(() => PasskeyRegistrationVerifyDataDTO)
  data: PasskeyRegistrationVerifyDataDTO;
}

/**
 * WebAuthn authentication response structure.
 */
export class WebAuthnAuthenticationResponseDTO {
  @IsDefined()
  @IsString()
  id: string;

  @IsDefined()
  @IsString()
  rawId: string;

  @IsDefined()
  @IsObject()
  response: {
    clientDataJSON: string;
    authenticatorData: string;
    signature: string;
    userHandle?: string;
  };

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  authenticatorAttachment?: string;
}

/**
 * Attributes for passkey authentication verification request.
 */
export class PasskeyAuthenticationVerifyAttributesDTO {
  /**
   * The pending challenge ID returned from authentication options.
   */
  @IsDefined()
  @IsUUID()
  pendingId: string;

  /**
   * The WebAuthn authentication response from navigator.credentials.get().
   */
  @IsDefined()
  @ValidateNested()
  @Type(() => WebAuthnAuthenticationResponseDTO)
  response: WebAuthnAuthenticationResponseDTO;
}

/**
 * Data wrapper for passkey authentication verification request.
 */
export class PasskeyAuthenticationVerifyDataDTO {
  @Equals(passkeyMeta.endpoint)
  type: string;

  @ValidateNested()
  @IsNotEmpty()
  @Type(() => PasskeyAuthenticationVerifyAttributesDTO)
  attributes: PasskeyAuthenticationVerifyAttributesDTO;
}

/**
 * DTO for passkey authentication verification during 2FA login flow.
 *
 * Used when a user completes passkey authentication to complete two-factor authentication.
 *
 * Endpoint: POST /auth/two-factor/verify/passkey
 */
export class PasskeyAuthenticationVerifyDTO {
  @ValidateNested()
  @IsNotEmpty()
  @Type(() => PasskeyAuthenticationVerifyDataDTO)
  data: PasskeyAuthenticationVerifyDataDTO;
}

/**
 * Attributes for passkey rename request.
 */
export class PasskeyRenameAttributesDTO {
  /**
   * The new name for the passkey.
   */
  @IsDefined()
  @IsNotEmpty()
  @IsString()
  name: string;
}

/**
 * Data wrapper for passkey rename request.
 */
export class PasskeyRenameDataDTO {
  @Equals(passkeyMeta.endpoint)
  type: string;

  @ValidateNested()
  @IsNotEmpty()
  @Type(() => PasskeyRenameAttributesDTO)
  attributes: PasskeyRenameAttributesDTO;
}

/**
 * DTO for passkey rename request.
 *
 * Endpoint: PATCH /auth/passkeys/:id
 */
export class PasskeyRenameDTO {
  @ValidateNested()
  @IsNotEmpty()
  @Type(() => PasskeyRenameDataDTO)
  data: PasskeyRenameDataDTO;
}
