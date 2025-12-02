import { Injectable } from "@nestjs/common";
import { JsonApiPaginator } from "../../../core/jsonapi/serialisers/jsonapi.paginator";
import { JsonApiService } from "../../../core/jsonapi/services/jsonapi.service";
import { NotificationModel } from "../../notification/entities/notification.model";
import { NotificationRepository } from "../../notification/repositories/notification.repository";

@Injectable()
export class NotificationServices {
  constructor(
    private readonly builder: JsonApiService,
    private readonly notificationRepository: NotificationRepository,
  ) {}

  async find(params: { query: any; userId: string; isArchived?: boolean }) {
    const paginator: JsonApiPaginator = new JsonApiPaginator(params.query);

    return this.builder.buildList(
      NotificationModel,
      await this.notificationRepository.find({
        userId: params.userId,
        isArchived: params.isArchived,
        cursor: paginator.generateCursor(),
      }),
      paginator,
    );
  }

  async findById(params: { notificationId: string; userId: string }) {
    return this.builder.buildSingle(NotificationModel, await this.notificationRepository.findById(params));
  }

  async markAsRead(params: { userId: string; notificationIds: string[] }) {
    return await this.notificationRepository.markAsRead(params);
  }

  async archive(params: { notificationId: string }) {
    await this.notificationRepository.archive({ notificationId: params.notificationId });
  }
}
