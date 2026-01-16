/**
 * RelationshipEntity Meta
 */
import { DataMeta } from "@carlonicora/nestjs-neo4jsonapi";

export const relationshipEntityMeta: DataMeta = {
  type: "relationship-entities",
  endpoint: "relationship-entities",
  nodeName: "relationshipEntity",
  labelName: "RelationshipEntity",
};
