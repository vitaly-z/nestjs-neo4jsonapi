import { IsIn, IsNotEmpty, IsOptional, IsString } from "class-validator";

/**
 * OAuth Token Introspection Request (RFC 7662 Section 2.1)
 */
export class OAuthIntrospectRequestDto {
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
  @IsNotEmpty()
  client_secret: string;
}

/**
 * OAuth Token Introspection Response (RFC 7662 Section 2.2)
 */
export class OAuthIntrospectResponseDto {
  active: boolean;
  scope?: string;
  client_id?: string;
  username?: string;
  token_type?: string;
  exp?: number;
  iat?: number;
  sub?: string;
  aud?: string;
  iss?: string;
}
