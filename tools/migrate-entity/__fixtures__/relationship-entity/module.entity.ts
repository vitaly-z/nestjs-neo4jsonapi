/**
 * Mock Module entity for testing relationship type imports
 */
import { Entity } from "@carlonicora/nestjs-neo4jsonapi";

export type Module = Entity & {
  name: string;
  permissions: object;
};
