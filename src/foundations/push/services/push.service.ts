import { Injectable } from "@nestjs/common";
import { baseConfig } from "../../../config/base.config";
import { PushSubscriptionDTO } from "../../push/dtos/subscription.push.dto";
import { Push } from "../../push/entities/push.entity";
import { PushRepository } from "../../push/repositories/push.repository";
import * as webPush from "web-push";

@Injectable()
export class PushService {
  private _isActive = true;
  private readonly vapidConfig = baseConfig.vapid;

  constructor(private readonly pushRepository: PushRepository) {
    if (!this.vapidConfig?.publicKey || !this.vapidConfig?.privateKey) {
      this._isActive = false;
      return;
    }

    webPush.setVapidDetails(
      `mailto:${this.vapidConfig.email}`,
      this.vapidConfig.publicKey,
      this.vapidConfig.privateKey,
    );
  }

  async registerSubscription(params: { subscription: PushSubscriptionDTO }): Promise<void> {
    if (!this._isActive) return;

    const existingPush = await this.pushRepository.findByEndpoint({ endpoint: params.subscription.endpoint });

    if (!existingPush || !existingPush.length)
      await this.pushRepository.create({
        endpoint: params.subscription.endpoint,
        p256dh: params.subscription.keys.p256dh,
        auth: params.subscription.keys.auth,
      });
  }

  async sendNotification(params: {
    pushSubscriptions: Push[];
    title: string;
    message: string;
    url: string;
  }): Promise<void> {
    if (!this._isActive) return;

    const payload = {
      title: params.title,
      message: params.message,
      url: params.url,
    };

    await Promise.all(
      params.pushSubscriptions.map(async (pushSubscription) => {
        try {
          await webPush.sendNotification(pushSubscription.subscription, JSON.stringify(payload));
        } catch (error) {
          console.error("Error sending push notification", error);
        }
      }),
    );
  }
}
