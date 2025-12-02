/**
 * Injection tokens for application-specific configuration.
 *
 * NOTE: Config values are accessed via `baseConfig` directly - no @Inject needed.
 * These tokens are only for application-specific values that consumers must provide.
 */

// Application-specific tokens (consumers must provide these)
export const JOB_NAMES = Symbol("JOB_NAMES");
export const QUEUE_IDS = Symbol("QUEUE_IDS");
export const CONTENT_TYPES = Symbol("CONTENT_TYPES");
export const COMPANY_CONFIGURATIONS_FACTORY = Symbol("COMPANY_CONFIGURATIONS_FACTORY");
export const ROLE_IDS = Symbol("ROLE_IDS");
