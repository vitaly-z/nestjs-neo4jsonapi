/**
 * Injection tokens for configuration
 *
 * These tokens are used with @Inject() decorator to inject configuration
 * into services without coupling to ConfigService.
 */

// API & Environment
export const API_CONFIG = Symbol('API_CONFIG');
export const APP_CONFIG = Symbol('APP_CONFIG');
export const ENVIRONMENT_CONFIG = Symbol('ENVIRONMENT_CONFIG');

// Database
export const NEO4J_CONFIG = Symbol('NEO4J_CONFIG');

// Cache & Queue
export const REDIS_CONFIG = Symbol('REDIS_CONFIG');
export const CACHE_CONFIG = Symbol('CACHE_CONFIG');
export const QUEUE_CONFIG = Symbol('QUEUE_CONFIG');

// Authentication & Security
export const JWT_CONFIG = Symbol('JWT_CONFIG');
export const ENCRYPTION_CONFIG = Symbol('ENCRYPTION_CONFIG');

// External Services
export const STRIPE_CONFIG = Symbol('STRIPE_CONFIG');
export const EMAIL_CONFIG = Symbol('EMAIL_CONFIG');
export const S3_CONFIG = Symbol('S3_CONFIG');
export const VAPID_CONFIG = Symbol('VAPID_CONFIG');

// AI
export const AI_CONFIG = Symbol('AI_CONFIG');

// Observability
export const LOGGING_CONFIG = Symbol('LOGGING_CONFIG');
export const TEMPO_CONFIG = Symbol('TEMPO_CONFIG');

// HTTP
export const CORS_CONFIG = Symbol('CORS_CONFIG');
export const RATE_LIMIT_CONFIG = Symbol('RATE_LIMIT_CONFIG');
