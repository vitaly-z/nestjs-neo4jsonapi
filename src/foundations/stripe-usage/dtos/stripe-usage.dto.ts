import { Type } from "class-transformer";
import {
  Equals,
  IsDefined,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
  IsDateString,
} from "class-validator";
import { stripeUsageRecordMeta } from "../entities/stripe-usage-record.meta";

/**
 * Base DTO for stripe-usage-record reference with ID and type validation
 */
export class StripeUsageRecordDTO {
  @Equals(stripeUsageRecordMeta.endpoint)
  type: string;

  @IsUUID()
  id: string;
}

/**
 * Attributes for creating a new usage record
 */
export class StripeUsageRecordPostAttributesDTO {
  @IsDefined()
  @IsString()
  meterId: string;

  @IsDefined()
  @IsString()
  meterEventName: string;

  @IsDefined()
  @IsNumber()
  @Min(0)
  quantity: number;

  @IsOptional()
  @IsDateString()
  timestamp?: string;
}

/**
 * Relationship reference to a subscription
 */
export class StripeUsageRecordSubscriptionRelationshipDataDTO {
  @IsString()
  type: string;

  @IsUUID()
  id: string;
}

export class StripeUsageRecordSubscriptionRelationshipDTO {
  @ValidateNested()
  @IsNotEmpty()
  @Type(() => StripeUsageRecordSubscriptionRelationshipDataDTO)
  data: StripeUsageRecordSubscriptionRelationshipDataDTO;
}

export class StripeUsageRecordRelationshipsDTO {
  @ValidateNested()
  @IsNotEmpty()
  @Type(() => StripeUsageRecordSubscriptionRelationshipDTO)
  subscription: StripeUsageRecordSubscriptionRelationshipDTO;
}

/**
 * Data object for POST request
 */
export class StripeUsageRecordPostDataDTO {
  @Equals(stripeUsageRecordMeta.endpoint)
  type: string;

  @IsOptional()
  @IsUUID()
  id?: string;

  @ValidateNested()
  @IsNotEmpty()
  @Type(() => StripeUsageRecordPostAttributesDTO)
  attributes: StripeUsageRecordPostAttributesDTO;

  @ValidateNested()
  @IsNotEmpty()
  @Type(() => StripeUsageRecordRelationshipsDTO)
  relationships: StripeUsageRecordRelationshipsDTO;
}

/**
 * JSON:API compliant POST body for creating usage records
 */
export class StripeUsageRecordPostDTO {
  @ValidateNested()
  @IsNotEmpty()
  @Type(() => StripeUsageRecordPostDataDTO)
  data: StripeUsageRecordPostDataDTO;

  @IsOptional()
  included?: any[];
}
