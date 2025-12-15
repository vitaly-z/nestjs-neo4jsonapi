import { Module } from "@nestjs/common";
import { CompanyModule } from "../company";
import { UserModule } from "../user";
import { DiscordUserRepository } from "./repositories/discord-user.repository";

@Module({
  controllers: [],
  providers: [DiscordUserRepository],
  exports: [DiscordUserRepository],
  imports: [CompanyModule, UserModule],
})
export class DiscordUserModule {}
