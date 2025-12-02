import { Module } from "@nestjs/common";
import { CacheInterceptor } from "./interceptors/cache.interceptor";
import { CacheService } from "./services/cache.service";

@Module({
  providers: [CacheService, CacheInterceptor],
  exports: [CacheService, CacheInterceptor],
})
export class CacheModule {}
