/**
 * SimpleEntity - Old-style mapper file
 * This represents the OLD pattern before migration
 */

import { MapperParams, mapBaseEntity } from "@carlonicora/nestjs-neo4jsonapi";
import { SimpleEntity } from "./simple-entity";

export const simpleEntityMapper = (params: MapperParams): SimpleEntity => ({
  ...mapBaseEntity(params),
  title: params.data.title,
  description: params.data.description,
  count: params.data.count ?? 0,
  isActive: params.data.isActive ?? false,
  createdAt: params.data.createdAt,
});
