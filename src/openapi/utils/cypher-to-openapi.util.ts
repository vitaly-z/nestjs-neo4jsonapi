import { CypherType, CypherBaseType, CypherArrayType } from "../../common/interfaces/entity.schema.interface";

/**
 * OpenAPI Schema Object subset used for type mapping.
 * Compatible with @nestjs/swagger SchemaObject.
 */
export interface OpenApiSchemaObject {
  type?: string;
  format?: string;
  items?: OpenApiSchemaObject | OpenApiRefObject;
  additionalProperties?: boolean;
  $ref?: string;
}

/**
 * OpenAPI Reference Object for schema references.
 */
export interface OpenApiRefObject {
  $ref: string;
}

/**
 * Maps a Neo4j/Cypher type to an OpenAPI schema object.
 * Handles both scalar types and array types.
 */
export function cypherTypeToOpenApi(cypherType: CypherType): OpenApiSchemaObject {
  // Handle array types
  if (cypherType.endsWith("[]")) {
    const baseType = cypherType.slice(0, -2) as CypherBaseType;
    return {
      type: "array",
      items: cypherBaseTypeToOpenApi(baseType),
    };
  }

  return cypherBaseTypeToOpenApi(cypherType as CypherBaseType);
}

/**
 * Maps a base Cypher type to an OpenAPI schema object.
 */
function cypherBaseTypeToOpenApi(baseType: CypherBaseType): OpenApiSchemaObject {
  switch (baseType) {
    case "string":
      return { type: "string" };
    case "number":
      return { type: "number" };
    case "boolean":
      return { type: "boolean" };
    case "date":
      return { type: "string", format: "date" };
    case "datetime":
      return { type: "string", format: "date-time" };
    case "json":
      return { type: "object", additionalProperties: true };
    default:
      // Fallback for unknown types
      return { type: "string" };
  }
}

/**
 * Type guard to check if a CypherType is an array type.
 */
export function isArrayType(cypherType: CypherType): cypherType is CypherArrayType {
  return cypherType.endsWith("[]");
}

/**
 * Extracts the base type from an array type.
 */
export function getBaseType(cypherType: CypherArrayType): CypherBaseType {
  return cypherType.slice(0, -2) as CypherBaseType;
}
