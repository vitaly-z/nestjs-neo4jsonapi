import { IsIn, IsNotEmpty, IsOptional, IsString } from "class-validator";

/**
 * OAuth Token Revocation Request (RFC 7009 Section 2.1)
 */
export class OAuthRevokeRequestDto {
  @IsString()
  @IsNotEmpty()
  token: string;

  @IsString()
  @IsOptional()
  @IsIn(["access_token", "refresh_token"])
  token_type_hint?: "access_token" | "refresh_token";

  @IsString()
  @IsNotEmpty()
  client_id: string;

  @IsString()
  @IsOptional()
  client_secret?: string;
}
