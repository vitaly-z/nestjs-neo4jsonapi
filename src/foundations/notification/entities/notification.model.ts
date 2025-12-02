import { DataModelInterface } from "../../../common/interfaces/datamodel.interface";
import { Notification } from "../../notification/entities/notification.entity";
import { mapNotification } from "../../notification/entities/notification.map";
import { notificationMeta } from "../../notification/entities/notification.meta";
import { NotificationSerialiser } from "../../notification/serialisers/notifications.serialiser";
import { userMeta } from "../../user/entities/user.meta";

export const NotificationModel: DataModelInterface<Notification> = {
  ...notificationMeta,
  entity: undefined as unknown as Notification,
  mapper: mapNotification,
  serialiser: NotificationSerialiser,
  singleChildrenTokens: [userMeta.nodeName],
};
