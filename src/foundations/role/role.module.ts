import { Module, OnModuleInit } from "@nestjs/common";

import { modelRegistry } from "../../common/registries/registry";
import { RoleUserController } from "./controllers/role.user.controller";
import { RoleDescriptor } from "./entities/role";
import { RoleController } from "./controllers/role.controller";
import { RoleRepository } from "./repositories/role.repository";
import { RoleService } from "./services/role.service";

@Module({
  controllers: [RoleController, RoleUserController],
  providers: [RoleRepository, RoleService, RoleDescriptor.model.serialiser],
  exports: [RoleRepository],
  imports: [],
})
export class RoleModule implements OnModuleInit {
  onModuleInit() {
    modelRegistry.register(RoleDescriptor.model);
  }
}
