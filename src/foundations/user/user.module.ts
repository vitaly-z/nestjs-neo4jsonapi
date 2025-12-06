import { Module, OnModuleInit } from "@nestjs/common";

import { modelRegistry } from "../../common/registries/registry";
import { CompanyModule } from "../company/company.module";
import { RelevancyModule } from "../relevancy";
import { S3Module } from "../s3/s3.module";
import { UserController } from "./controllers/user.controller";
import { AssigneeModel, AuthorModel, OwnerModel, UserModel } from "./entities/user.model";
import { UserRepository } from "./repositories/user.repository";
import { UserSerialiser } from "./serialisers/user.serialiser";
import { UserCypherService } from "./services/user.cypher.service";
import { UserService } from "./services/user.service";

@Module({
  controllers: [UserController],
  providers: [UserRepository, UserService, UserSerialiser, UserCypherService],
  exports: [UserService, UserRepository, UserSerialiser, UserCypherService],
  imports: [CompanyModule, S3Module, RelevancyModule],
})
export class UserModule implements OnModuleInit {
  onModuleInit() {
    modelRegistry.register(UserModel);
    modelRegistry.register(OwnerModel);
    modelRegistry.register(AssigneeModel);
    modelRegistry.register(AuthorModel);
  }
}
