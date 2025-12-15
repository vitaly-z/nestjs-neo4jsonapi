import { Module } from "@nestjs/common";
import { AuthModule } from "../auth";
import { CompanyModule } from "../company";
import { UserModule } from "../user";
import { DiscordController } from "./controllers/discord.controller";
import { DiscordRepository } from "./repositories/discord.repository";
import { DiscordService } from "./services/discord.service";

@Module({
  controllers: [DiscordController],
  providers: [DiscordService, DiscordRepository],
  exports: [],
  imports: [AuthModule, CompanyModule, UserModule],
})
export class DiscordModule {}
