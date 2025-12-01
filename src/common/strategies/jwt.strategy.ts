import { HttpException, Inject, Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ClsService } from "nestjs-cls";
import { ExtractJwt, Strategy } from "passport-jwt";
import type { ConfigJwtInterface } from "../../config/interfaces/config.jwt.interface";
import { JWT_CONFIG } from "../../config/tokens";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly cls: ClsService,
    @Inject(JWT_CONFIG) jwtConfig: ConfigJwtInterface,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: jwtConfig.secret,
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: any) {
    const now = new Date();
    const expiration = new Date(payload.expiration);

    if (expiration < now) throw new HttpException("Token expired", 401);

    this.cls.set("userId", payload.userId);

    return payload;
  }
}
