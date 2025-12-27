import { Entity } from "../../../common/abstracts/entity";
import { User } from "../../user/entities/user.entity";

export type Notification = Entity & {
  notificationType: string;
  isRead: boolean;
  message?: string;
  actionUrl?: string;

  actor?: User;
};
