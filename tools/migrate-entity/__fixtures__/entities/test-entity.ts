/**
 * TestEntity - Old-style entity file (type only)
 * This represents the OLD pattern before migration
 */

import { Entity } from "@carlonicora/nestjs-neo4jsonapi";
import { Company } from "@carlonicora/nestjs-neo4jsonapi";
import { User } from "@carlonicora/nestjs-neo4jsonapi";

/**
 * TestEntity Entity Type
 */
export type TestEntity = Entity & {
  name: string;
  description?: string;
  url?: string;
  samplePhotographs?: string[];
  tags?: string[];
  position?: number;
  isActive?: boolean;
  score?: number;
  createdDate?: Date;

  company: Company;
  author: User;
};
