import { Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  ValidateNested,
} from "class-validator";

/**
 * OAuth Client Create DTO (JSON:API format)
 */
class OAuthClientAttributesCreateDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  redirectUris: string[];

  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  allowedScopes: string[];

  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  allowedGrantTypes?: string[];

  @IsBoolean()
  @IsOptional()
  isConfidential?: boolean;

  @IsNumber()
  @IsPositive()
  @IsOptional()
  accessTokenLifetime?: number;

  @IsNumber()
  @IsPositive()
  @IsOptional()
  refreshTokenLifetime?: number;
}

class OAuthClientDataCreateDto {
  @IsString()
  @IsIn(["oauth-clients"])
  type: string;

  @ValidateNested()
  @Type(() => OAuthClientAttributesCreateDto)
  attributes: OAuthClientAttributesCreateDto;
}

export class OAuthClientCreateDto {
  @ValidateNested()
  @Type(() => OAuthClientDataCreateDto)
  data: OAuthClientDataCreateDto;
}

/**
 * OAuth Client Update DTO (JSON:API format)
 */
class OAuthClientAttributesUpdateDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  redirectUris?: string[];

  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  allowedScopes?: string[];

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

class OAuthClientDataUpdateDto {
  @IsString()
  @IsIn(["oauth-clients"])
  type: string;

  @IsString()
  id: string;

  @ValidateNested()
  @Type(() => OAuthClientAttributesUpdateDto)
  attributes: OAuthClientAttributesUpdateDto;
}

export class OAuthClientUpdateDto {
  @ValidateNested()
  @Type(() => OAuthClientDataUpdateDto)
  data: OAuthClientDataUpdateDto;
}
