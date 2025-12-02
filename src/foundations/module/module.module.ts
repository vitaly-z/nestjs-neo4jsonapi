import { Module, OnModuleInit } from "@nestjs/common";
import { modelRegistry } from "../../common/registries/registry";
import { ModuleModel } from "./entities/module.model";
import { ModuleRepository } from "./repositories/module.repository";

import { ModuleSerialiser } from "./serialisers/module.serialiser";

@Module({
  controllers: [],
  providers: [ModuleSerialiser, ModuleRepository],
  exports: [ModuleSerialiser, ModuleRepository],
  imports: [],
})
export class ModuleModule implements OnModuleInit {
  onModuleInit() {
    modelRegistry.register(ModuleModel);
  }
}
