import { Type } from "class-transformer";
import { Equals, IsBoolean, IsNotEmpty, IsOptional, IsUUID, ValidateNested } from "class-validator";
import { notificationMeta } from "../../notification/entities/notification.meta";

export class NotificationPatchAttributesDTO {
  @IsOptional()
  @IsBoolean()
  isRead: boolean;
}

export class NotificationDataPatchDTO {
  @Equals(notificationMeta.endpoint)
  type: string;

  @IsUUID()
  id: string;

  @ValidateNested()
  @IsNotEmpty()
  @Type(() => NotificationPatchAttributesDTO)
  attributes: NotificationPatchAttributesDTO;
}

export class NotificationPatchDTO {
  @ValidateNested()
  @IsNotEmpty()
  @Type(() => NotificationDataPatchDTO)
  data: NotificationDataPatchDTO;
}

export class NotificationPatchListDTO {
  @ValidateNested({ each: true })
  @IsNotEmpty()
  @Type(() => NotificationDataPatchDTO)
  data: NotificationDataPatchDTO[];
}
