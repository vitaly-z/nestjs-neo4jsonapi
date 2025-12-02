import { Module } from "@nestjs/common";
import { RedisClientStorageService } from "./services/redis.client.storage.service";
import { RedisMessagingService } from "./services/redis.messaging.service";

@Module({
  providers: [RedisClientStorageService, RedisMessagingService],
  exports: [RedisClientStorageService, RedisMessagingService],
})
export class RedisModule {}
