import { Type } from "class-transformer";
import { Equals, IsNotEmpty, IsNumber, IsOptional, IsUUID, ValidateNested } from "class-validator";
import { userMeta } from "../../user/entities/user.meta";

export class UserPatchRateAttributesDTO {
  @IsOptional()
  @IsNumber()
  rate?: number;
}

export class UserPatchRateDataDTO {
  @Equals(userMeta.endpoint)
  type: string;

  @IsUUID()
  id: string;

  @ValidateNested({ each: true })
  @IsOptional()
  @Type(() => UserPatchRateAttributesDTO)
  attributes: UserPatchRateAttributesDTO;
}

export class UserPatchRateDTO {
  @ValidateNested()
  @IsNotEmpty()
  @Type(() => UserPatchRateDataDTO)
  data: UserPatchRateDataDTO;

  @IsOptional()
  included: any[];
}
