import { Module, OnModuleInit } from "@nestjs/common";

import { modelRegistry } from "../../common/registries/registry";
import { CompanyModule } from "../company/company.module";
import { S3Module } from "../s3/s3.module";
import {
  AssigneeModel,
  BccUserModel,
  CcUserModel,
  FromUserModel,
  OwnerModel,
  ReaderModel,
  ToUserModel,
  UserModel,
} from "./entities/user.model";
import { UserSerialiser } from "./serialisers/user.serialiser";
import { UserCypherService } from "./services/user.cypher.service";
import { UserController } from "./controllers/user.controller";
import { UserRepository } from "./repositories/user.repository";
import { UserService } from "./services/user.service";

@Module({
  controllers: [UserController],
  providers: [UserRepository, UserService, UserSerialiser, UserCypherService],
  exports: [UserService, UserRepository, UserSerialiser],
  imports: [CompanyModule, S3Module],
})
export class UserModule implements OnModuleInit {
  onModuleInit() {
    modelRegistry.register(UserModel);
    modelRegistry.register(OwnerModel);
    modelRegistry.register(AssigneeModel);
    modelRegistry.register(ReaderModel);
    modelRegistry.register(ToUserModel);
    modelRegistry.register(FromUserModel);
    modelRegistry.register(CcUserModel);
    modelRegistry.register(BccUserModel);
  }
}
