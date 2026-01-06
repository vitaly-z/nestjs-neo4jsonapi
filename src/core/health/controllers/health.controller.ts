import { Controller, Get } from "@nestjs/common";
import { SkipThrottle } from "@nestjs/throttler";
import { HealthCheck, HealthCheckService, HealthCheckResult } from "@nestjs/terminus";
import { Neo4jHealthIndicator } from "../indicators/neo4j.health";
import { RedisHealthIndicator } from "../indicators/redis.health";
import { S3HealthIndicator } from "../indicators/s3.health";
import { DiskHealthIndicator } from "../indicators/disk.health";

/**
 * Health Check Controller
 *
 * Provides health check endpoints for monitoring and orchestration.
 * All endpoints are PUBLIC (no authentication required).
 * Rate limiting is disabled for health endpoints.
 *
 * Endpoints:
 * - GET /health - Full health status with all dependency checks
 * - GET /health/live - Liveness probe (process is running)
 * - GET /health/ready - Readiness probe (can accept traffic)
 */
@Controller("health")
@SkipThrottle()
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private neo4jHealth: Neo4jHealthIndicator,
    private redisHealth: RedisHealthIndicator,
    private s3Health: S3HealthIndicator,
    private diskHealth: DiskHealthIndicator,
  ) {}

  /**
   * Full health check endpoint
   *
   * Checks all dependencies and returns detailed status.
   * Use for monitoring dashboards and detailed health analysis.
   *
   * @returns HealthCheckResult with status of all dependencies
   * - HTTP 200: All dependencies healthy
   * - HTTP 503: One or more dependencies unhealthy
   */
  @Get()
  @HealthCheck()
  async check(): Promise<HealthCheckResult> {
    return this.health.check([
      () => this.neo4jHealth.isHealthy("neo4j"),
      () => this.redisHealth.isHealthy("redis"),
      () => this.s3Health.isHealthy("storage"),
      () => this.diskHealth.isHealthy("disk"),
    ]);
  }

  /**
   * Liveness probe endpoint
   *
   * Indicates if the application process is running.
   * Does NOT check external dependencies.
   *
   * Use for Kubernetes livenessProbe:
   * - If this fails, container should be restarted
   *
   * @returns HealthCheckResult
   * - HTTP 200: Process is alive
   */
  @Get("live")
  @HealthCheck()
  async liveness(): Promise<HealthCheckResult> {
    // Liveness only checks if process is running
    // No external dependency checks
    return this.health.check([]);
  }

  /**
   * Readiness probe endpoint
   *
   * Indicates if the application can accept traffic.
   * Checks critical dependencies (Neo4j, Redis).
   *
   * Use for Kubernetes readinessProbe:
   * - If this fails, traffic should be routed elsewhere
   * - Container should NOT be restarted
   *
   * @returns HealthCheckResult
   * - HTTP 200: Ready to accept traffic
   * - HTTP 503: Not ready (dependency unavailable)
   */
  @Get("ready")
  @HealthCheck()
  async readiness(): Promise<HealthCheckResult> {
    // Readiness checks critical dependencies needed to handle requests
    return this.health.check([() => this.neo4jHealth.isHealthy("neo4j"), () => this.redisHealth.isHealthy("redis")]);
  }
}
