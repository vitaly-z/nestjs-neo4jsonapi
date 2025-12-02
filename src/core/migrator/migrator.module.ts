import { Module } from "@nestjs/common";
import { MigratorService } from "./services/migrator.service";

/**
 * Migrator Module
 *
 * Provides Neo4j database migration functionality
 *
 * Features:
 * - Automatic migration discovery from neo4j.migrations/ folder
 * - Transaction-based execution
 * - Version tracking with date and increment
 * - Development and production support
 *
 * @example
 * Create a migration file: src/neo4j.migrations/20231201_01.ts
 * ```typescript
 * import { MigrationInterface } from '@your-package/core/migrator';
 *
 * export const migration: MigrationInterface[] = [
 *   {
 *     query: 'CREATE CONSTRAINT user_email IF NOT EXISTS FOR (u:User) REQUIRE u.email IS UNIQUE',
 *     queryParams: {},
 *   },
 * ];
 * ```
 */
@Module({
  providers: [MigratorService],
  exports: [MigratorService],
})
export class MigratorModule {}
