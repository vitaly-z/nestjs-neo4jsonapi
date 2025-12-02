import { Module, OnModuleInit } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { AuthController } from "./controllers/auth.controller";

import { modelRegistry } from "../../common/registries/registry";
import { AuthCodeModel } from "./entities/auth.code.model";
import { AuthModel } from "./entities/auth.model";
import { AuthSerialiser } from "./serialisers/auth.serialiser";
import { CompanyModule } from "../company/company.module";
import { UserModule } from "../user/user.module";
import { AuthRepository } from "./repositories/auth.repository";
import { AuthService } from "./services/auth.service";

@Module({
  controllers: [AuthController],
  providers: [AuthService, AuthRepository, AuthSerialiser],
  exports: [AuthService],
  imports: [UserModule, JwtModule, CompanyModule],
})
export class AuthModule implements OnModuleInit {
  onModuleInit() {
    modelRegistry.register(AuthModel);
    modelRegistry.register(AuthCodeModel);
  }
}
