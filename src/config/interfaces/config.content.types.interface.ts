/**
 * Content types configuration for multi-label content queries
 */
export interface ConfigContentTypesInterface {
  /** Neo4j label names for content types (e.g., ["Article", "Document", "Discussion"]) */
  types: string[];
}
