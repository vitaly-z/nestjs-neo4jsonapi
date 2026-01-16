/**
 * ComplexEntity - Old-style mapper file
 * This represents the OLD pattern before migration
 * Includes computed fields from Neo4j record
 */

import { MapperParams, mapBaseEntity } from "@carlonicora/nestjs-neo4jsonapi";
import { ComplexEntity } from "./complex-entity";

export const complexEntityMapper = (params: MapperParams): ComplexEntity => ({
  ...mapBaseEntity(params),
  name: params.data.name,
  description: params.data.description,
  tags: params.data.tags,
  priority: params.data.priority ?? 0,
  isPublished: params.data.isPublished ?? false,
  publishedAt: params.data.publishedAt,

  // Meta/computed fields from Neo4j record
  position: params.data.position,
  totalScore: params.record.has("totalScore") ? Number(params.record.get("totalScore")) : undefined,
  itemCount: params.record.has("itemCount")
    ? params.record.get("itemCount")?.low ?? params.record.get("itemCount") ?? 0
    : undefined,

  // Relationships (initialized empty, populated later)
  author: undefined as any,
  company: undefined as any,
  items: [],
});
