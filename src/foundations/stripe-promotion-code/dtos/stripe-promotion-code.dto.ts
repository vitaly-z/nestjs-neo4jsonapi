import { Type } from "class-transformer";
import { Equals, IsDefined, IsNotEmpty, IsOptional, IsString, ValidateNested } from "class-validator";
import { stripePromotionCodeMeta } from "../entities/stripe-promotion-code.meta";

// Attributes for validation request
export class ValidatePromotionCodeAttributesDTO {
  @IsDefined()
  @IsString()
  code: string;

  @IsOptional()
  @IsString()
  stripePriceId?: string;
}

// Data DTO for the JSON:API structure
export class ValidatePromotionCodeDataDTO {
  @Equals(stripePromotionCodeMeta.endpoint)
  type: string;

  @ValidateNested()
  @IsNotEmpty()
  @Type(() => ValidatePromotionCodeAttributesDTO)
  attributes: ValidatePromotionCodeAttributesDTO;
}

// Main DTO for POST /stripe-promotion-codes/validate
export class ValidatePromotionCodeDTO {
  @ValidateNested()
  @IsNotEmpty()
  @Type(() => ValidatePromotionCodeDataDTO)
  data: ValidatePromotionCodeDataDTO;
}
