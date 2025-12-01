import { ConfigAiInterface } from './config.ai.interface';
import { ConfigApiInterface } from './config.api.interface';
import { ConfigAppInterface } from './config.app.interface';
import { ConfigCacheInterface } from './config.cache.interface';
import { ConfigCorsInterface } from './config.cors.interface';
import { ConfigEmailInterface } from './config.email.interface';
import { ConfigEncryptionInterface } from './config.encryption.interface';
import { ConfigEnvironmentInterface } from './config.environment.interface';
import { ConfigJwtInterface } from './config.jwt.interface';
import { ConfigLoggingInterface } from './config.logging.interface';
import { ConfigNeo4jInterface } from './config.neo4j.interface';
import { ConfigRateLimitInterface } from './config.ratelimit.interface';
import { ConfigRedisInterface } from './config.redis.interface';
import { ConfigS3Interface } from './config.s3.interface';
import { ConfigTempoInterface } from './config.tempo.interface';
import { ConfigVapidInterface } from './config.vapid.interface';
import { ConfigStripeInterface } from './config.stripe.interface';

export interface BaseConfigInterface {
  environment: ConfigEnvironmentInterface;
  api: ConfigApiInterface;
  app: ConfigAppInterface;
  neo4j: ConfigNeo4jInterface;
  redis: ConfigRedisInterface;
  cache: ConfigCacheInterface;
  cors: ConfigCorsInterface;
  jwt: ConfigJwtInterface;
  vapid: ConfigVapidInterface;
  email: ConfigEmailInterface;
  logging: ConfigLoggingInterface;
  tempo: ConfigTempoInterface;
  s3: ConfigS3Interface;
  ai: ConfigAiInterface;
  rateLimit: ConfigRateLimitInterface;
  encryption: ConfigEncryptionInterface;
  stripe: ConfigStripeInterface;
}
