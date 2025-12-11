import { DataMeta } from "../../../common/interfaces/datamodel.interface";

/**
 * Defines an additional relationship to be included in Content responses.
 */
export interface ContentRelationshipExtension {
  /** Meta information for the related model (e.g., topicMeta, expertiseMeta) */
  model: DataMeta;

  /** Neo4j relationship type (e.g., "HAS_KNOWLEDGE") */
  relationship: string;

  /** Direction of the relationship relative to Content node */
  direction: "in" | "out";

  /** Whether this is a one-to-one or one-to-many relationship */
  cardinality: "one" | "many";

  /** Optional JSON:API key override (e.g., "topics" instead of "topic") */
  dtoKey?: string;
}

/**
 * Configuration for extending Content module with additional relationships.
 *
 * This allows APIs to inject custom relationships that will be:
 * - Queried via OPTIONAL MATCH in Cypher
 * - Included in JSON:API serialization
 * - Mapped in entity results
 *
 * @example
 * ```typescript
 * const contentExtension: ContentExtensionConfig = {
 *   additionalRelationships: [
 *     {
 *       model: topicMeta,
 *       relationship: "HAS_KNOWLEDGE",
 *       direction: "in",
 *       cardinality: "many",
 *       dtoKey: "topics",
 *     },
 *   ],
 * };
 * ```
 */
export interface ContentExtensionConfig {
  additionalRelationships: ContentRelationshipExtension[];
}

/**
 * Injection token for Content extension configuration.
 * Use with @Optional() @Inject(CONTENT_EXTENSION_CONFIG) to make it optional.
 */
export const CONTENT_EXTENSION_CONFIG = Symbol("CONTENT_EXTENSION_CONFIG");
