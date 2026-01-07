import { IsIn, IsNotEmpty, IsOptional, IsString } from "class-validator";

/**
 * OAuth Authorization Query Parameters (RFC 6749 Section 4.1.1)
 */
export class OAuthAuthorizeQueryDto {
  @IsString()
  @IsIn(["code"])
  response_type: string;

  @IsString()
  @IsNotEmpty()
  client_id: string;

  @IsString()
  @IsNotEmpty()
  redirect_uri: string;

  @IsString()
  @IsOptional()
  scope?: string;

  @IsString()
  @IsOptional()
  state?: string;

  @IsString()
  @IsOptional()
  code_challenge?: string;

  @IsString()
  @IsOptional()
  @IsIn(["S256", "plain"])
  code_challenge_method?: string;
}
