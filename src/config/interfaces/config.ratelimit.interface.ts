export interface ConfigRateLimitInterface {
  enabled: boolean;
  ttl: number;
  limit: number;
  ipLimit: number;
}
