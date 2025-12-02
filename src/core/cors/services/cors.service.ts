import { Injectable } from "@nestjs/common";
import { CorsOptions } from "@nestjs/common/interfaces/external/cors-options.interface";
import { baseConfig } from "../../../config/base.config";

@Injectable()
export class CorsService {
  private readonly corsConfig = baseConfig.cors;

  getCorsConfiguration(): CorsOptions {
    return {
      origin: this.getOriginValidator(),
      credentials: this.corsConfig.credentials,
      methods: this.corsConfig.methods,
      allowedHeaders: this.corsConfig.allowedHeaders,
      maxAge: this.corsConfig.maxAge,
      preflightContinue: this.corsConfig.preflightContinue,
      optionsSuccessStatus: this.corsConfig.optionsSuccessStatus,
    };
  }

  private getOriginValidator():
    | ((origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => void)
    | boolean
    | string
    | string[] {
    const { origins, originPatterns, logViolations } = this.corsConfig;

    if (origins.length === 0 && originPatterns.length === 0) {
      if (logViolations) {
        console.error("CORS: No origins or patterns configured, allowing all origins (insecure)");
      }
      return true;
    }

    return (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      // Allow requests without Origin header (e.g., server-to-server, Postman, curl)
      // This is standard CORS behavior - only browser requests include Origin header
      if (!origin) {
        return callback(null, true);
      }

      const isAllowed = this.isOriginAllowed(origin);

      if (!isAllowed && logViolations) {
        console.error(`CORS: Rejected request from origin: ${origin}`);
      }

      callback(null, isAllowed);
    };
  }

  private isOriginAllowed(origin: string): boolean {
    const { origins, originPatterns } = this.corsConfig;

    if (origins.includes(origin)) {
      return true;
    }

    for (const pattern of originPatterns) {
      try {
        const regex = new RegExp(pattern);
        if (regex.test(origin)) {
          return true;
        }
      } catch (error) {
        console.error(`CORS: Invalid origin pattern: ${pattern}`, error);
      }
    }

    return false;
  }

  validateConfiguration(): void {
    const { origins, originPatterns } = this.corsConfig;

    if (origins.length === 0 && originPatterns.length === 0) {
      console.error(
        "CORS: No origins or patterns configured. This will allow all origins which is insecure for production.",
      );
    }

    for (const origin of origins) {
      if (!this.isValidOrigin(origin)) {
        console.error(`CORS: Invalid origin configured: ${origin}`);
      }
    }

    for (const pattern of originPatterns) {
      try {
        new RegExp(pattern);
      } catch (error) {
        console.error(`CORS: Invalid origin pattern: ${pattern}`, error);
      }
    }
  }

  private isValidOrigin(origin: string): boolean {
    try {
      new URL(origin);
      return true;
    } catch {
      return false;
    }
  }

  getOrigins(): string[] {
    return this.corsConfig.origins;
  }

  getOriginPatterns(): string[] {
    return this.corsConfig.originPatterns;
  }

  getCredentialsPolicy(): boolean {
    return this.corsConfig.credentials;
  }
}
