import { Module } from "@nestjs/common";
import { CompanyModule } from "../company";
import { UserModule } from "../user";
import { GoogleUserRepository } from "./repositories/google-user.repository";
import { GoogleUserService } from "./services/google-user.service";

@Module({
  controllers: [],
  providers: [GoogleUserRepository, GoogleUserService],
  exports: [GoogleUserRepository, GoogleUserService],
  imports: [CompanyModule, UserModule],
})
export class GoogleUserModule {}
