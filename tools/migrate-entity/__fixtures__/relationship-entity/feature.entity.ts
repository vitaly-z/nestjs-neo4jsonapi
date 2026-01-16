/**
 * Mock Feature entity for testing relationship type imports
 */
import { Entity } from "@carlonicora/nestjs-neo4jsonapi";

export type Feature = Entity & {
  name: string;
  isCore: boolean;
};
