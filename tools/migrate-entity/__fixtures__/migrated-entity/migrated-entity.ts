/**
 * MigratedEntity - Already migrated entity
 * This represents the NEW pattern after migration
 * The migration tool should detect this and skip it
 */

import { Entity, defineEntity } from "@carlonicora/nestjs-neo4jsonapi";
import { migratedEntityMeta } from "./migrated-entity.meta";

/**
 * MigratedEntity Entity Type
 */
export type MigratedEntity = Entity & {
  name: string;
  description?: string;
  count: number;
};

/**
 * MigratedEntity Descriptor - New pattern
 */
export const MigratedEntityDescriptor = defineEntity<MigratedEntity>()({
  ...migratedEntityMeta,
  fields: {
    name: { type: "string", required: true },
    description: { type: "string" },
    count: { type: "number", required: true, default: 0 },
  },
});

export type MigratedEntityDescriptorType = typeof MigratedEntityDescriptor;
