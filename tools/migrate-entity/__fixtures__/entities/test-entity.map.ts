/**
 * TestEntity - Old-style mapper file
 * This represents the OLD pattern before migration
 */

import { MapperParams, mapBaseEntity } from "@carlonicora/nestjs-neo4jsonapi";
import { TestEntity } from "./test-entity";

export const testEntityMapper = (params: MapperParams): TestEntity => ({
  ...mapBaseEntity(params),
  name: params.data.name,
  description: params.data.description,
  url: params.data.url,
  samplePhotographs: params.data.samplePhotographs,
  tags: params.data.tags,
  position: params.data.position,
  isActive: params.data.isActive,
  score: params.data.score,
  createdDate: params.data.createdDate,
  relevance: params.record.has("totalScore") ? Number(params.record.get("totalScore")) : undefined,
  itemCount: params.record.has("itemCount")
    ? params.record.get("itemCount")?.low ?? params.record.get("itemCount") ?? 0
    : undefined,
});
