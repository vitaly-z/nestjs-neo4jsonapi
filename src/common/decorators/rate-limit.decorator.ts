import { SkipThrottle, Throttle } from "@nestjs/throttler";

export const NoRateLimit = () => SkipThrottle();

export const StrictRateLimit = (limit: number = 5, ttl: number = 60000) => Throttle({ ip: { limit, ttl } });

export const CustomRateLimit = (limit: number, ttl: number = 60000) => Throttle({ default: { limit, ttl } });

export const HeavyOperationRateLimit = (limit: number = 10, ttl: number = 300000) =>
  Throttle({ default: { limit, ttl } });

export const IPRateLimit = (limit: number, ttl: number = 60000) => Throttle({ ip: { limit, ttl } });
