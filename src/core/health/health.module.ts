import { Module } from "@nestjs/common";
import { TerminusModule } from "@nestjs/terminus";
import { HealthController } from "./controllers/health.controller";
import { Neo4jHealthIndicator } from "./indicators/neo4j.health";
import { RedisHealthIndicator } from "./indicators/redis.health";
import { S3HealthIndicator } from "./indicators/s3.health";
import { DiskHealthIndicator } from "./indicators/disk.health";

@Module({
  imports: [TerminusModule],
  controllers: [HealthController],
  providers: [Neo4jHealthIndicator, RedisHealthIndicator, S3HealthIndicator, DiskHealthIndicator],
  exports: [Neo4jHealthIndicator, RedisHealthIndicator, S3HealthIndicator, DiskHealthIndicator],
})
export class HealthModule {}
