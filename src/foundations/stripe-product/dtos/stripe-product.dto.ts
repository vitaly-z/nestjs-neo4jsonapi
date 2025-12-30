import { Type } from "class-transformer";
import {
  Equals,
  IsDefined,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from "class-validator";
import { stripeProductMeta } from "../entities/stripe-product.meta";

// Base DTO for reference with ID and type validation
export class StripeProductDTO {
  @Equals(stripeProductMeta.endpoint)
  type: string;

  @IsUUID()
  id: string;
}

// POST DTOs (for creating products)
export class StripeProductPostAttributesDTO {
  @IsDefined()
  @IsString()
  @MaxLength(255)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, string>;
}

export class StripeProductPostDataDTO {
  @Equals(stripeProductMeta.endpoint)
  type: string;

  @IsUUID()
  id: string;

  @ValidateNested()
  @IsNotEmpty()
  @Type(() => StripeProductPostAttributesDTO)
  attributes: StripeProductPostAttributesDTO;
}

export class StripeProductPostDTO {
  @ValidateNested()
  @IsNotEmpty()
  @Type(() => StripeProductPostDataDTO)
  data: StripeProductPostDataDTO;

  @IsOptional()
  included?: any[];
}

// PUT DTOs (for updating products)
export class StripeProductPutAttributesDTO {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, string>;
}

export class StripeProductPutDataDTO {
  @Equals(stripeProductMeta.endpoint)
  type: string;

  @IsUUID()
  id: string;

  @ValidateNested()
  @IsOptional()
  @Type(() => StripeProductPutAttributesDTO)
  attributes?: StripeProductPutAttributesDTO;
}

export class StripeProductPutDTO {
  @ValidateNested()
  @IsNotEmpty()
  @Type(() => StripeProductPutDataDTO)
  data: StripeProductPutDataDTO;

  @IsOptional()
  included?: any[];
}
