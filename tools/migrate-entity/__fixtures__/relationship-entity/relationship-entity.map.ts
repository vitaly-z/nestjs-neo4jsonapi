/**
 * RelationshipEntity Mapper - Old-style map file
 */
import { mapEntity } from "@carlonicora/nestjs-neo4jsonapi";
import { RelationshipEntity } from "./relationship-entity";

export function mapRelationshipEntity(params: {
  data: Record<string, any>;
  record: any;
}): RelationshipEntity {
  return {
    ...mapEntity({ record: params.data }),
    name: params.data.name,
    description: params.data.description,
    isActive: params.data.isActive ?? false,
    feature: [],
    module: [],
  };
}
