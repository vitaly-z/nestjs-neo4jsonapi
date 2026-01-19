import { Type } from "class-transformer";
import {
  Equals,
  IsBoolean,
  IsDefined,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Max,
  Min,
  ValidateNested,
} from "class-validator";
import { stripeSubscriptionMeta } from "../entities/stripe-subscription.meta";

// Base DTO for reference with ID and type validation
export class StripeSubscriptionDTO {
  @Equals(stripeSubscriptionMeta.endpoint)
  type: string;

  @IsUUID()
  id: string;
}

// POST DTOs (for creating subscriptions)
export class StripeSubscriptionPostAttributesDTO {
  @IsOptional()
  @IsString()
  paymentMethodId?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(365)
  trialPeriodDays?: number;

  @IsOptional()
  @IsInt()
  @IsPositive()
  quantity?: number;

  @IsOptional()
  @IsString()
  promotionCode?: string;
}

// Relationship DTOs for stripePrice
export class StripePriceRelationshipDataDTO {
  @IsString()
  type: string;

  @IsUUID()
  id: string;
}

export class StripePriceRelationshipDTO {
  @ValidateNested()
  @Type(() => StripePriceRelationshipDataDTO)
  data: StripePriceRelationshipDataDTO;
}

export class StripeSubscriptionPostRelationshipsDTO {
  @ValidateNested()
  @IsDefined()
  @Type(() => StripePriceRelationshipDTO)
  stripePrice: StripePriceRelationshipDTO;
}

export class StripeSubscriptionPostDataDTO {
  @Equals(stripeSubscriptionMeta.endpoint)
  type: string;

  @IsUUID()
  id: string;

  @ValidateNested()
  @IsOptional()
  @Type(() => StripeSubscriptionPostAttributesDTO)
  attributes?: StripeSubscriptionPostAttributesDTO;

  @ValidateNested()
  @IsDefined()
  @Type(() => StripeSubscriptionPostRelationshipsDTO)
  relationships: StripeSubscriptionPostRelationshipsDTO;
}

export class StripeSubscriptionPostDTO {
  @ValidateNested()
  @IsNotEmpty()
  @Type(() => StripeSubscriptionPostDataDTO)
  data: StripeSubscriptionPostDataDTO;

  @IsOptional()
  included?: any[];
}

// Cancel subscription DTOs
export class StripeSubscriptionCancelAttributesDTO {
  @IsOptional()
  @IsBoolean()
  cancelImmediately?: boolean;
}

export class StripeSubscriptionCancelDataDTO {
  @Equals(stripeSubscriptionMeta.endpoint)
  type: string;

  @IsUUID()
  id: string;

  @ValidateNested()
  @IsOptional()
  @Type(() => StripeSubscriptionCancelAttributesDTO)
  attributes?: StripeSubscriptionCancelAttributesDTO;
}

export class StripeSubscriptionCancelDTO {
  @ValidateNested()
  @IsNotEmpty()
  @Type(() => StripeSubscriptionCancelDataDTO)
  data: StripeSubscriptionCancelDataDTO;

  @IsOptional()
  included?: any[];
}

// Change plan DTOs
export class StripeSubscriptionChangePlanAttributesDTO {
  @IsDefined()
  @IsString()
  @IsUUID()
  priceId: string;

  @IsOptional()
  @IsInt()
  @IsPositive()
  quantity?: number;

  @IsOptional()
  @IsString()
  promotionCode?: string;
}

export class StripeSubscriptionChangePlanDataDTO {
  @Equals(stripeSubscriptionMeta.endpoint)
  type: string;

  @IsUUID()
  id: string;

  @ValidateNested()
  @IsNotEmpty()
  @Type(() => StripeSubscriptionChangePlanAttributesDTO)
  attributes: StripeSubscriptionChangePlanAttributesDTO;
}

export class StripeSubscriptionChangePlanDTO {
  @ValidateNested()
  @IsNotEmpty()
  @Type(() => StripeSubscriptionChangePlanDataDTO)
  data: StripeSubscriptionChangePlanDataDTO;

  @IsOptional()
  included?: any[];
}
