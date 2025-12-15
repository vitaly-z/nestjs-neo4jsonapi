import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import axios from "axios";
import { randomUUID } from "crypto";
import { ClsService } from "nestjs-cls";
import { RoleId } from "../../../common";
import { BaseConfigInterface, ConfigApiInterface } from "../../../config";
import { ConfigDiscordInterface } from "../../../config/interfaces/config.discord.interface";
import { AuthService } from "../../auth";
import { CompanyRepository } from "../../company";
import { User, UserRepository } from "../../user";
import { Discord } from "../entities/discord";
import { DiscordRepository } from "../repositories/discord.repository";
import { discordUser } from "../types/discord.user.type";

@Injectable()
export class DiscordService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly discordRepository: DiscordRepository,
    private readonly companyRepository: CompanyRepository,
    private readonly authService: AuthService,
    private readonly config: ConfigService<BaseConfigInterface>,
    private readonly clsService: ClsService,
  ) {}

  private readonly _discordApiUrl = "https://discord.com/api/";

  generateLoginUrl(): string {
    return `${this._discordApiUrl}oauth2/authorize?client_id=${this.config.get<ConfigDiscordInterface>("discord").clientId}&redirect_uri=${this.config.get<ConfigApiInterface>("api").url}auth/callback/discord&response_type=code&scope=identify%20email`;
  }

  async handleDiscordLogin(params: { userDetails: discordUser }): Promise<string> {
    const discordUser: Discord = await this.discordRepository.findByDiscordId({ discordId: params.userDetails.id });
    let user: User;

    if (discordUser) {
      if (discordUser.user.avatar !== params.userDetails.avatar) {
        await this.userRepository.updateAvatar({
          userId: discordUser.user.id,
          avatar: params.userDetails.avatar,
        });
      }
      user = discordUser.user;
    } else {
      const id = randomUUID();
      const companyId = randomUUID();

      await this.companyRepository.create({
        companyId: companyId,
        name: `${params.userDetails.username}`,
      });
      this.clsService.set("companyId", companyId);

      await this.userRepository.create({
        userId: id,
        email: params.userDetails.email,
        name: params.userDetails.username,
        password: randomUUID(),
        companyId: companyId,
        avatar: params.userDetails.avatar,
        roleIds: [RoleId.CompanyAdministrator],
      });
      this.clsService.set("userId", id);

      await this.discordRepository.create({
        id: id,
        discordId: params.userDetails.id,
        name: params.userDetails.username,
        user: id,
      });

      user = await this.userRepository.findByUserId({ userId: id });
    }

    const token: any = await this.authService.createToken({ user: user });
    const authCodeId = randomUUID();

    await this.authService.createCode({
      authCodeId: authCodeId,
      authId: token.data.attributes.refreshToken,
    });

    return `${process.env.APP_URL}/auth?code=${authCodeId}`;
  }

  async exchangeCodeForToken(code: string): Promise<string> {
    const response = await axios.post(
      `${this._discordApiUrl}oauth2/token`,
      new URLSearchParams({
        client_id: this.config.get<ConfigDiscordInterface>("discord").clientId,
        client_secret: this.config.get<ConfigDiscordInterface>("discord").clientSecret,
        grant_type: "authorization_code",
        code: code,
        redirect_uri: `${this.config.get<ConfigApiInterface>("api").url}auth/callback/discord`,
      }).toString(),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      },
    );

    return response.data.access_token;
  }

  async fetchUserDetails(accessToken: string): Promise<discordUser> {
    const response = await axios.get(`${this._discordApiUrl}users/@me`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const avatarUrl = response.data.avatar
      ? `~https://cdn.discordapp.com/avatars/${response.data.id}/${response.data.avatar}.png`
      : null;

    return {
      id: response.data.id,
      email: response.data.email,
      username: response.data.username,
      avatar: avatarUrl,
    };
  }
}
