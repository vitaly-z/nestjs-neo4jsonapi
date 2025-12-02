import { Module, OnModuleInit } from "@nestjs/common";
import { modelRegistry } from "../../common/registries/registry";
import { NotificationController } from "./controllers/notification.controller";
import { NotificationModel } from "./entities/notification.model";
import { NotificationRepository } from "./repositories/notification.repository";
import { NotificationSerialiser } from "./serialisers/notifications.serialiser";
import { NotificationServices } from "./services/notification.service";

@Module({
  controllers: [NotificationController],
  providers: [NotificationRepository, NotificationServices, NotificationSerialiser],
  exports: [NotificationRepository],
  imports: [],
})
export class NotificationModule implements OnModuleInit {
  onModuleInit() {
    modelRegistry.register(NotificationModel);
  }
}
