import { IsIn, IsNotEmpty, IsOptional, IsString, ValidateIf } from "class-validator";

/**
 * OAuth Token Request (RFC 6749 Section 4.1.3, 4.3.2, 6)
 *
 * Supports all grant types in a single DTO:
 * - authorization_code
 * - client_credentials
 * - refresh_token
 */
export class OAuthTokenRequestDto {
  @IsString()
  @IsIn(["authorization_code", "client_credentials", "refresh_token"])
  grant_type: string;

  // Authorization Code Grant fields
  @ValidateIf((o) => o.grant_type === "authorization_code")
  @IsString()
  @IsNotEmpty()
  code?: string;

  @ValidateIf((o) => o.grant_type === "authorization_code")
  @IsString()
  @IsNotEmpty()
  redirect_uri?: string;

  @IsString()
  @IsOptional()
  code_verifier?: string;

  // All grants need client_id
  @IsString()
  @IsNotEmpty()
  client_id: string;

  // Client secret (required for confidential clients)
  @IsString()
  @IsOptional()
  client_secret?: string;

  // Refresh Token Grant fields
  @ValidateIf((o) => o.grant_type === "refresh_token")
  @IsString()
  @IsNotEmpty()
  refresh_token?: string;

  // Scope (optional for all grants)
  @IsString()
  @IsOptional()
  scope?: string;
}

/**
 * OAuth Token Response (RFC 6749 Section 5.1)
 */
export class OAuthTokenResponseDto {
  access_token: string;
  token_type: "Bearer";
  expires_in: number;
  refresh_token?: string;
  scope?: string;
}
