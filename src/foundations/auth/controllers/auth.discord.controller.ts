import { Controller, Get, HttpException, HttpStatus, Query, Req, Res } from "@nestjs/common";
import { FastifyReply } from "fastify";
import { authMeta } from "..";
import { discordUser } from "../../discord-user/types/discord.user.type";
import { AuthDiscordService } from "../services/auth.discord.service";

@Controller()
export class AuthDiscordController {
  constructor(private readonly authDiscordService: AuthDiscordService) {}

  // @Get(`${DiscordDescriptor.model.endpoint}/:discordId`)
  // async findOneByParameterId(@Param("discordId") discordId: string) {
  //   return this.discordService.findByDiscordId(discordId);
  // }

  // @Post(DiscordDescriptor.model.endpoint)
  // async createFromDiscord(@Body() body: any) {
  //   return this.discordService.createFromDiscord(body);
  // }

  @Get(`${authMeta.endpoint}/discord`)
  async loginWithDiscord(@Res() reply: FastifyReply) {
    if (!process.env.DISCORD_CLIENT_ID || !process.env.DISCORD_CLIENT_SECRET)
      throw new HttpException("Login with Discord is not available", HttpStatus.NOT_IMPLEMENTED);

    reply.redirect(this.authDiscordService.generateLoginUrl(), 302);
  }

  @Get(`${authMeta.endpoint}/callback/discord`)
  async callbackDiscord(@Res() reply: FastifyReply, @Req() request: any, @Query("code") code: string) {
    const accessToken = await this.authDiscordService.exchangeCodeForToken(code);
    const userDetails = await this.authDiscordService.fetchUserDetails(accessToken);

    const redirectUrl = await this.authDiscordService.handleDiscordLogin({ userDetails: userDetails as discordUser });

    reply.redirect(redirectUrl, 302);
  }
}
