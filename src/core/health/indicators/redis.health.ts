import { Injectable } from "@nestjs/common";
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from "@nestjs/terminus";
import { RedisClientStorageService } from "../../redis/services/redis.client.storage.service";

@Injectable()
export class RedisHealthIndicator extends HealthIndicator {
  private readonly TIMEOUT_MS = 3000;

  constructor(private readonly redisService: RedisClientStorageService) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      // Check if Redis client is connected
      const isConnected = this.redisService.isConnected();

      if (!isConnected) {
        throw new Error("Redis client not connected");
      }

      // Execute PING command to verify responsiveness
      const redis = this.redisService.getRedisClient();

      // Create a timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("Health check timeout")), this.TIMEOUT_MS);
      });

      // Execute PING
      const pingPromise = redis.ping();

      // Race between ping and timeout
      const result = await Promise.race([pingPromise, timeoutPromise]);

      if (result !== "PONG") {
        throw new Error(`Unexpected PING response: ${result}`);
      }

      return this.getStatus(key, true, {
        message: "Redis connection healthy",
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      throw new HealthCheckError(
        "Redis health check failed",
        this.getStatus(key, false, {
          message: errorMessage,
        }),
      );
    }
  }
}
