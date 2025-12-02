import { Module, OnModuleInit } from "@nestjs/common";
import { modelRegistry } from "../../common/registries/registry";
import { PushController } from "./controllers/push.controller";
import { PushModel } from "./entities/push.model";
import { PushRepository } from "./repositories/push.repository";
import { PushService } from "./services/push.service";

@Module({
  controllers: [PushController],
  providers: [PushService, PushRepository],
  exports: [PushRepository, PushService],
  imports: [],
})
export class PushModule implements OnModuleInit {
  onModuleInit() {
    modelRegistry.register(PushModel);
  }
}
