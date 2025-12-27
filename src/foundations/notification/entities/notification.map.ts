import { mapEntity } from "../../../common/abstracts/entity";
import { EntityFactory } from "../../../core/neo4j/factories/entity.factory";
import { Notification } from "../../notification/entities/notification.entity";

export const mapNotification = (params: { data: any; record: any; entityFactory: EntityFactory }): Notification => {
  return {
    ...mapEntity({ record: params.data }),
    notificationType: params.data.notificationType,
    isRead: params.data.isRead ?? false,
    message: params.data.message,
    actionUrl: params.data.actionUrl,
    actor: undefined,
  };
};
