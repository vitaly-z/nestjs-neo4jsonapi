import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";

/**
 * Decoded pending JWT payload structure.
 * This token is issued after password validation but before 2FA verification.
 */
export interface PendingAuthPayload {
  userId: string;
  pendingId: string;
  type: "pending_2fa";
  exp: number;
}

/**
 * Guard for two-factor verification endpoints.
 *
 * This guard validates pending 2FA tokens that are issued after password validation.
 * Pending tokens have limited scope and cannot access protected endpoints.
 * They are only valid for 2FA verification endpoints.
 *
 * The guard:
 * 1. Extracts the Bearer token from Authorization header
 * 2. Verifies the JWT signature
 * 3. Validates that the token type is "pending_2fa"
 * 4. Attaches the decoded payload to request.pendingAuth
 */
@Injectable()
export class PendingAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      throw new UnauthorizedException("Missing authorization header");
    }

    const token = authHeader.slice(7);

    try {
      const decoded = this.jwtService.verify<PendingAuthPayload>(token);

      if (!this.isPendingToken(decoded)) {
        throw new UnauthorizedException("Invalid token type - expected pending 2FA token");
      }

      request.pendingAuth = decoded;
      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException("Invalid or expired pending token");
    }
  }

  /**
   * Check if the decoded token is a valid pending 2FA token.
   */
  private isPendingToken(decoded: any): decoded is PendingAuthPayload {
    return (
      decoded &&
      typeof decoded === "object" &&
      decoded.type === "pending_2fa" &&
      typeof decoded.userId === "string" &&
      typeof decoded.pendingId === "string"
    );
  }
}
