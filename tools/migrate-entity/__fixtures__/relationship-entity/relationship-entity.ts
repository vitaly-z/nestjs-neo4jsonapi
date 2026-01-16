/**
 * RelationshipEntity - Entity with local relationship type imports
 * This tests that the migration tool uses "import type" for non-framework relationship types
 */

import { Entity } from "@carlonicora/nestjs-neo4jsonapi";
import { Feature } from "./feature.entity";
import { Module } from "./module.entity";

/**
 * RelationshipEntity Entity Type
 */
export type RelationshipEntity = Entity & {
  name: string;
  description?: string;
  isActive: boolean;

  // Relationships imported from local entity files (not framework)
  feature: Feature[];
  module: Module[];
};
