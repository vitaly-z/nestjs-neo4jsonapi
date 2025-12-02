import { Injectable, OnModuleInit } from "@nestjs/common";
import * as fs from "fs";
import * as path from "path";
import { AppLoggingService } from "../../logging/services/logging.service";
import { Neo4jService } from "../../neo4j/services/neo4j.service";
import { MigrationInterface } from "../interfaces/migration.interface";

/**
 * Migrator Service
 *
 * Manages Neo4j database migrations
 *
 * Features:
 * - Automatic migration discovery
 * - Transaction-based migration execution
 * - Migration versioning with date and increment
 * - Development and production support
 * - Unique constraint enforcement
 *
 * @example
 * Migration file: neo4j.migrations/20231201_01.ts
 * ```typescript
 * export const migration: MigrationInterface[] = [
 *   {
 *     query: 'CREATE CONSTRAINT user_email IF NOT EXISTS FOR (u:User) REQUIRE u.email IS UNIQUE',
 *     queryParams: {},
 *   },
 * ];
 * ```
 */
@Injectable()
export class MigratorService implements OnModuleInit {
  constructor(
    protected readonly neo4jService: Neo4jService,
    private readonly logger: AppLoggingService,
  ) {}

  async onModuleInit() {
    await this.createMigrationConstraints();
    await this.runMigrations();
  }

  private async createMigrationConstraints() {
    try {
      await this.neo4jService.writeOne({
        query: `CREATE CONSTRAINT migration_version IF NOT EXISTS FOR (migration:Migration) REQUIRE migration.version IS UNIQUE`,
      });

      await this.neo4jService.writeOne({
        query: `CREATE CONSTRAINT migration_date_increment IF NOT EXISTS FOR (migration:Migration) REQUIRE (migration.versionDate, migration.versionIncrement) IS UNIQUE`,
      });
    } catch (error: any) {
      this.logError("Failed to create migration constraints:", error);
    }
  }

  private async runMigrations() {
    try {
      const lastAppliedMigration = await this.getLastAppliedMigration();
      const availableMigrations = await this.discoverMigrations();
      const migrationsToRun = this.filterMigrationsToRun(availableMigrations, lastAppliedMigration);

      if (migrationsToRun.length === 0) {
        this.log("No migrations to run");
        return;
      }

      await this.executeMigrations(migrationsToRun);
      this.log(`Successfully applied ${migrationsToRun.length} migrations`);
    } catch (error: any) {
      this.logError("Migration failed:", error);
      throw error;
    }
  }

  private async getLastAppliedMigration(): Promise<string | null> {
    try {
      const result = await this.neo4jService.read(
        "MATCH (m:Migration) RETURN m ORDER BY m.versionDate DESC, m.versionIncrement DESC LIMIT 1",
        {},
      );

      return result.records.length > 0 ? result.records[0].get("m").properties.version : null;
    } catch (error: any) {
      this.logError("Failed to get last applied migration:", error);
      return null;
    }
  }

  private async discoverMigrations(): Promise<string[]> {
    // Try dist folder first (production), then src folder (development)
    const distDir = path.join(process.cwd(), "dist", "neo4j.migrations");
    const srcDir = path.join(process.cwd(), "src", "neo4j.migrations");

    let migrationsDir = distDir;
    if (!fs.existsSync(distDir)) {
      migrationsDir = srcDir;
    }

    if (!fs.existsSync(migrationsDir)) {
      this.logWarn("Migrations directory not found in both dist and src folders");
      return [];
    }

    const files = fs.readdirSync(migrationsDir);
    const migrationFiles = files
      .filter((file) => (file.endsWith(".ts") || file.endsWith(".js")) && !file.endsWith(".d.ts"))
      .map((file) => file.replace(/\.(ts|js)$/, ""))
      .sort();

    return migrationFiles;
  }

  private filterMigrationsToRun(availableMigrations: string[], lastAppliedMigration: string | null): string[] {
    if (!lastAppliedMigration) {
      return availableMigrations;
    }

    return availableMigrations.filter((migration) => this.compareVersions(migration, lastAppliedMigration) > 0);
  }

  private compareVersions(versionA: string, versionB: string): number {
    const [dateA, incrementA] = versionA.split("_");
    const [dateB, incrementB] = versionB.split("_");

    // First compare dates
    if (dateA !== dateB) {
      return dateA.localeCompare(dateB);
    }

    // If dates are equal, compare increments numerically
    const numA = parseInt(incrementA, 10);
    const numB = parseInt(incrementB, 10);
    return numA - numB;
  }

  private async executeMigrations(migrationNames: string[]) {
    for (const migrationName of migrationNames) {
      const migrationQueries = await this.loadMigrationFile(migrationName);

      const queries: { query: string; params?: any }[] = [
        ...migrationQueries.map((mq) => ({
          query: mq.query,
          params: mq.queryParams,
        })),
        {
          query: `
            CREATE (m:Migration {
              version: $version,
              versionDate: $versionDate,
              versionIncrement: $versionIncrement,
              appliedAt: datetime()
            })
          `,
          params: {
            version: migrationName,
            versionDate: parseInt(migrationName.split("_")[0], 10),
            versionIncrement: parseInt(migrationName.split("_")[1], 10),
          },
        },
      ];

      await this.neo4jService.executeInTransaction(queries);
      this.log(`Applied migration: ${migrationName}`);
    }
  }

  private async loadMigrationFile(migrationName: string): Promise<MigrationInterface[]> {
    try {
      // Try to import from the compiled dist folder first (production)
      let migrationModule: any;
      try {
        const distPath = path.join(process.cwd(), "dist", "neo4j.migrations", migrationName);
        migrationModule = await import(distPath);
      } catch (distError: any) {
        this.log("Falling back to src folder for migration:", migrationName, distError.message);
        const srcPath = path.join(process.cwd(), "src", "neo4j.migrations", migrationName);
        migrationModule = await import(srcPath);
      }

      if (!migrationModule["migration"]) {
        throw new Error(`Migration export 'migration' not found in ${migrationName}`);
      }

      return migrationModule["migration"];
    } catch (error: any) {
      throw new Error(`Failed to load migration ${migrationName}: ${error.message}`);
    }
  }

  private log(message: string, ...args: any[]) {
    this.logger.log(message, ...args);
  }

  private logWarn(message: string, ...args: any[]) {
    this.logger.warn(message, ...args);
  }

  private logError(message: string, error: any) {
    this.logger.error(message, error);
  }
}
