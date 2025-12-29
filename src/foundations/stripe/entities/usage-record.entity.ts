import { Entity } from "../../../common/abstracts/entity";
import { Subscription } from "../entities/subscription.entity";

export type UsageRecord = Entity & {
  subscriptionId: string;
  meterId: string;
  meterEventName: string;
  quantity: number;
  timestamp: Date;
  stripeEventId?: string;
  subscription?: Subscription;
};
