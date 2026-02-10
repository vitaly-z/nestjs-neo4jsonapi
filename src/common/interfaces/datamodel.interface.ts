import { AbstractJsonApiSerialiser } from "../../core/jsonapi/abstracts/abstract.jsonapi.serialiser";
import { JsonApiServiceInterface } from "../../core/jsonapi/interfaces/jsonapi.service.interface";

export function getEndpoint(modelGetter: () => DataModelInterface<any>): string {
  return modelGetter().endpoint;
}

export type SerialiserType = AbstractJsonApiSerialiser & JsonApiServiceInterface;

export type DataMeta = {
  type: string;
  endpoint: string;
  nodeName: string;
  labelName: string;
};

/**
 * Relationship info for proper self-referential relationship support.
 * Tracks both the model's nodeName (for registry lookup) and the
 * relationship name (for Cypher column matching and property assignment).
 */
export type RelationshipInfo = {
  nodeName: string; // Model's nodeName for looking up in registry
  relationshipName: string; // Property name on entity (for Cypher column and assignment)
};

export type DataModelInterface<T> = DataMeta & {
  entity: T;
  mapper: (params: { data: any; record: any; entityFactory: any; name?: string }) => T;
  serialiser?: new (...args: any[]) => SerialiserType;
  childrenTokens?: string[];
  singleChildrenTokens?: string[];
  dynamicChildrenPatterns?: string[];
  dynamicSingleChildrenPatterns?: string[];
  // New: full relationship info for proper self-referential support
  childrenRelationships?: RelationshipInfo[];
  singleChildrenRelationships?: RelationshipInfo[];
};
