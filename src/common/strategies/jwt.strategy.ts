import { HttpException, Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ClsService } from "nestjs-cls";
import { ExtractJwt, Strategy } from "passport-jwt";
import { baseConfig } from "../../config/base.config";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly cls: ClsService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: baseConfig.jwt?.secret,
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
