#!/usr/bin/env ts-node
/**
 * Entity Migration CLI
 *
 * Migrates old-style entities (5 files) to new descriptor-based pattern (1 file).
 *
 * Usage:
 *   npx ts-node tools/migrate-entity --path src/features/article
 *   npx ts-node tools/migrate-entity --path src/foundations/user
 *   npx ts-node tools/migrate-entity --all
 *   npx ts-node tools/migrate-entity --path src/features/article --dry-run
 */

import { Command } from "commander";
import { EntityMigrator, printMigrationSummary } from "./lib/entity-migrator";

const program = new Command();

program
  .name("migrate-entity")
  .description("Migrate old-style entities to new descriptor-based architecture")
  .option("-p, --path <module-path>", "Path to module folder (e.g., src/features/article)")
  .option("-e, --entity <name>", "Entity name if module has multiple (e.g., auth.code)")
  .option("-a, --all", "Migrate all entities in codebase")
  .option("-d, --dry-run", "Preview changes without writing files")
  .option("--skip-backup", "Skip creating backup files")
  .option("-v, --verbose", "Verbose output")
  .parse();

async function main() {
  const options = program.opts();

  console.log("\n🔄 Entity Migration CLI");
  console.log("========================\n");

  if (options.dryRun) {
    console.log("⚠️  DRY RUN MODE - No files will be modified\n");
  }

  const migrator = new EntityMigrator({
    path: options.path,
    entity: options.entity,
    all: options.all,
    dryRun: options.dryRun,
    skipBackup: options.skipBackup,
    verbose: options.verbose,
  });

  let result;

  if (options.all) {
    result = await migrator.migrateAll();
  } else if (options.path) {
    result = await migrator.migrate(options.path, options.entity);
  } else {
    program.help();
    return;
  }

  printMigrationSummary(result);

  if (result.failureCount > 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("\n❌ Migration failed:", error.message);
  if (process.env.DEBUG) {
    console.error(error.stack);
  }
  process.exit(1);
});
