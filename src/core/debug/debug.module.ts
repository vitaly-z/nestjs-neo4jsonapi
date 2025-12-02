import { Global, Module } from "@nestjs/common";
import { DebugLoggerService } from "./services/debug.logger.service";

/**
 * Debug Module
 *
 * Provides debugging utilities for development
 *
 * Features:
 * - Structured logging for game rounds and turns
 * - LLM call tracking
 * - File-based log persistence
 * - Async logging support for background jobs
 *
 * Environment Variables:
 * - DEBUG_LOGGING_ENABLED: Enable/disable debug logging (default: false)
 * - DEBUG_LOG_PATH: Path to store log files (default: ./logs)
 *
 * @example
 * ```typescript
 * @Module({
 *   imports: [DebugModule],
 * })
 * export class AppModule {}
 * ```
 */
@Global()
@Module({
  providers: [DebugLoggerService],
  exports: [DebugLoggerService],
})
export class DebugModule {}
