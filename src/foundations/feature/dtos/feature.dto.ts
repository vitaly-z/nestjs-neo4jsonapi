import { Type } from "class-transformer";
import { Equals, IsNotEmpty, IsUUID, ValidateNested } from "class-validator";
import { featureMeta } from "../../feature/entities/feature.meta";

export class FeatureDTO {
  @Equals(featureMeta.endpoint)
  type: string;

  @IsUUID()
  id: string;
}

export class FeatureDataDTO {
  @ValidateNested()
  @IsNotEmpty()
  @Type(() => FeatureDTO)
  data: FeatureDTO;
}

export class FeatureDataListDTO {
  @ValidateNested({ each: true })
  @IsNotEmpty()
  @Type(() => FeatureDTO)
  data: FeatureDTO[];
}
