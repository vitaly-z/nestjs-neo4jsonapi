/**
 * RelationshipEntity Model - Old-style model file
 */
import { DataModelInterface } from "@carlonicora/nestjs-neo4jsonapi";
import { RelationshipEntity } from "./relationship-entity";
import { mapRelationshipEntity } from "./relationship-entity.map";
import { relationshipEntityMeta } from "./relationship-entity.meta";
import { RelationshipEntitySerialiser } from "./relationship-entity.serialiser";
import { featureMeta } from "./feature.meta";
import { moduleMeta } from "./module.meta";

export const RelationshipEntityModel: DataModelInterface<RelationshipEntity> = {
  ...relationshipEntityMeta,
  entity: undefined as unknown as RelationshipEntity,
  mapper: mapRelationshipEntity,
  serialiser: RelationshipEntitySerialiser,
  childrenTokens: [featureMeta.nodeName, moduleMeta.nodeName],
};
