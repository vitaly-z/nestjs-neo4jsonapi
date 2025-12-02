import { Entity } from "../../../common/abstracts/entity";
import { PushSubscriptionDTO } from "../../push/dtos/subscription.push.dto";

export type Push = Entity & {
  endpoint: string;
  p256dh: string;
  auth: string;
  subscription: PushSubscriptionDTO;
};
