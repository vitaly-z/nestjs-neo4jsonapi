import { Type } from "class-transformer";
import { Equals, IsNotEmpty, IsUUID, ValidateNested } from "class-validator";
import { contentMeta } from "../../content/entities/content.meta";

export class ContentDTO {
  @Equals(contentMeta.endpoint)
  type: string;

  @IsUUID()
  id: string;
}

export class ContentDataDTO {
  @ValidateNested()
  @IsNotEmpty()
  @Type(() => ContentDTO)
  data: ContentDTO;
}

export class ContentDataListDTO {
  @ValidateNested({ each: true })
  @IsNotEmpty()
  @Type(() => ContentDTO)
  data: ContentDTO[];
}
