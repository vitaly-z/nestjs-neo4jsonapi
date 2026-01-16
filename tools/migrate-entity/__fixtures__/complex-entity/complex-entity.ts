/**
 * ComplexEntity - Old-style entity file (type only)
 * This represents the OLD pattern before migration
 * Has multiple relationships, computed fields, and meta fields
 */

import { Entity } from "@carlonicora/nestjs-neo4jsonapi";
import { User } from "@carlonicora/nestjs-neo4jsonapi";
import { Company } from "@carlonicora/nestjs-neo4jsonapi";

/**
 * Item type for relationships (plain interface, not an Entity)
 */
export interface Item {
  id: string;
  name: string;
}

/**
 * ComplexEntity Entity Type
 */
export type ComplexEntity = Entity & {
  // Scalar attributes
  name: string;
  description?: string;
  tags?: string[];
  priority: number;
  isPublished: boolean;
  publishedAt?: Date;

  // Meta fields (computed/aggregated)
  position?: number;
  totalScore?: number;
  itemCount?: number;

  // Relationships
  author: User;
  company: Company;
  items: Item[];
};
