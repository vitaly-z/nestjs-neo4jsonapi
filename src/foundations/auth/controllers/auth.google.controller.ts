import { Controller, Get, HttpException, HttpStatus, Query, Res } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { FastifyReply } from "fastify";
import { authMeta } from "..";
import { BaseConfigInterface, ConfigGoogleInterface } from "../../../config/interfaces";
import { googleUser } from "../../google-user/types/google.user.type";
import { AuthGoogleService } from "../services/auth.google.service";

@Controller()
export class AuthGoogleController {
  constructor(
    private readonly authGoogleService: AuthGoogleService,
    private readonly configService: ConfigService<BaseConfigInterface>,
  ) {}

  private get googleConfig(): ConfigGoogleInterface {
    return this.configService.get<ConfigGoogleInterface>("google");
  }

  @Get(`${authMeta.endpoint}/google`)
  async loginWithGoogle(@Res() reply: FastifyReply) {
    if (!this.googleConfig.clientId || !this.googleConfig.clientSecret)
      throw new HttpException("Login with Google is not available", HttpStatus.NOT_IMPLEMENTED);

    reply.redirect(this.authGoogleService.generateLoginUrl(), 302);
  }

  @Get(`${authMeta.endpoint}/callback/google`)
  async callbackGoogle(@Res() reply: FastifyReply, @Query("code") code: string) {
    const accessToken = await this.authGoogleService.exchangeCodeForToken(code);
    const userDetails = await this.authGoogleService.fetchUserDetails(accessToken);

    const redirectUrl = await this.authGoogleService.handleGoogleLogin({ userDetails: userDetails as googleUser });

    reply.redirect(redirectUrl, 302);
  }
}
