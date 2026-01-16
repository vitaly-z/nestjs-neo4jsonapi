/**
 * SimpleEntity - Old-style entity file (type only)
 * This represents the OLD pattern before migration
 * No S3 transforms, no relationships - basic entity
 */

import { Entity } from "@carlonicora/nestjs-neo4jsonapi";

/**
 * SimpleEntity Entity Type
 */
export type SimpleEntity = Entity & {
  title: string;
  description?: string;
  count: number;
  isActive: boolean;
  createdAt?: Date;
};
