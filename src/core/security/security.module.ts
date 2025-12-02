import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { baseConfig } from "../../config/base.config";
import { AdminJwtAuthGuard } from "../../common/guards/jwt.auth.admin.guard";
import { JwtAuthGuard } from "../../common/guards/jwt.auth.guard";
import { OptionalJwtAuthGuard } from "../../common/guards/jwt.auth.optional.guard";
import { JwtStrategy } from "../../common/strategies/jwt.strategy";
import { SecurityService } from "./services/security.service";

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: "jwt" }),
    JwtModule.register({
      secret: baseConfig.jwt?.secret,
      signOptions: { expiresIn: (baseConfig.jwt?.expiresIn ?? "24h") as any },
    }),
  ],
  providers: [SecurityService, JwtStrategy, JwtAuthGuard, OptionalJwtAuthGuard, AdminJwtAuthGuard],
  exports: [SecurityService, JwtStrategy, JwtAuthGuard, OptionalJwtAuthGuard, AdminJwtAuthGuard, PassportModule],
})
export class SecurityModule {}
