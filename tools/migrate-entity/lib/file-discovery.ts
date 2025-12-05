/**
 * Entity Migration CLI - File Discovery Module
 *
 * Discovers old-style entity files within a module path.
 */

import * as fs from "fs";
import * as path from "path";
import { glob } from "glob";
import { OldEntityFiles } from "./types";

/**
 * Discovers all old-style entity files within a module path.
 *
 * @param modulePath - Path to the module folder (e.g., "src/features/article")
 * @param entityName - Optional specific entity name to filter by
 * @returns Array of discovered entity file sets
 */
export async function discoverOldFiles(modulePath: string, entityName?: string): Promise<OldEntityFiles[]> {
  const absolutePath = path.isAbsolute(modulePath) ? modulePath : path.resolve(process.cwd(), modulePath);

  // Find all *.meta.ts files to identify entities
  const metaPattern = path.join(absolutePath, "**/*.meta.ts");
  const metaFiles = await glob(metaPattern, { nodir: true });

  // Filter by entity name if provided
  const filtered = entityName ? metaFiles.filter((f) => f.includes(`${entityName}.meta.ts`)) : metaFiles;

  return filtered.map((metaFile) => {
    const baseName = metaFile.replace(".meta.ts", "");
    const dir = path.dirname(metaFile);
    const name = path.basename(baseName);

    // Entity file can be either {name}.ts or {name}.entity.ts
    const entityFile = fs.existsSync(`${baseName}.entity.ts`)
      ? `${baseName}.entity.ts`
      : fs.existsSync(`${baseName}.ts`)
        ? `${baseName}.ts`
        : null;

    return {
      entityName: name,
      entityDir: dir,
      entity: entityFile,
      meta: metaFile,
      model: fs.existsSync(`${baseName}.model.ts`) ? `${baseName}.model.ts` : null,
      map: fs.existsSync(`${baseName}.map.ts`) ? `${baseName}.map.ts` : null,
      serialiser: findSerialiserFile(absolutePath, name),
    };
  });
}

/**
 * Finds the serialiser file for an entity, checking common locations.
 */
function findSerialiserFile(modulePath: string, entityName: string): string | null {
  const candidates = [
    path.join(modulePath, "serialisers", `${entityName}.serialiser.ts`),
    path.join(modulePath, `${entityName}.serialiser.ts`),
    path.join(modulePath, "entities", `${entityName}.serialiser.ts`),
  ];

  return candidates.find((c) => fs.existsSync(c)) || null;
}

/**
 * Gets the module path from a file path.
 * Extracts the feature/foundation module directory.
 */
export function getModulePath(filePath: string): string {
  // Match patterns like src/features/article/... or src/foundations/user/...
  const match = filePath.match(/(src\/(features|foundations)\/[^/]+)/);
  return match ? match[1] : path.dirname(filePath);
}

/**
 * Discovers all module paths in the codebase that contain old-style entities.
 */
export async function discoverAllModulePaths(): Promise<string[]> {
  const metaPattern = "src/**/*.meta.ts";
  const metaFiles = await glob(metaPattern, { nodir: true, cwd: process.cwd() });

  const modulePaths = new Set<string>();
  for (const metaFile of metaFiles) {
    modulePaths.add(getModulePath(metaFile));
  }

  return Array.from(modulePaths);
}

/**
 * Checks if an entity has already been migrated to the new descriptor pattern.
 */
export function isAlreadyMigrated(files: OldEntityFiles): boolean {
  if (!files.entity) return false;

  const entityContent = fs.readFileSync(files.entity, "utf-8");
  return entityContent.includes("defineEntity<");
}
