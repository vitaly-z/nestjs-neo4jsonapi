import { OpenApiRefObject } from "../utils/cypher-to-openapi.util";

/**
 * Reference object for $ref schemas.
 */
export type RefObject = OpenApiRefObject;

/**
 * Extended OpenAPI Schema Object for JSON:API schemas.
 * Includes all properties needed for complex OpenAPI schemas.
 */
export interface JsonApiSchemaObject {
  type?: string;
  format?: string;
  required?: string[];
  properties?: Record<string, JsonApiSchemaObject | RefObject>;
  description?: string;
  example?: unknown;
  oneOf?: (JsonApiSchemaObject | RefObject)[];
  allOf?: (JsonApiSchemaObject | RefObject)[];
  minItems?: number;
  items?: JsonApiSchemaObject | RefObject;
  additionalProperties?: boolean;
  $ref?: string;
}

/**
 * JSON:API Resource Identifier schema.
 * Represents a reference to another resource: { type, id }
 */
export const JsonApiResourceIdentifierSchema: JsonApiSchemaObject = {
  type: "object",
  required: ["type", "id"],
  properties: {
    type: {
      type: "string",
      description: "The JSON:API type of the resource",
      example: "photographs",
    },
    id: {
      type: "string",
      description: "The unique identifier of the resource",
      example: "abc123-def456",
    },
  },
};

/**
 * JSON:API Relationship object schema.
 * Contains data (resource linkage) and optional links.
 */
export const JsonApiRelationshipSchema: JsonApiSchemaObject = {
  type: "object",
  properties: {
    data: {
      oneOf: [
        { $ref: "#/components/schemas/JsonApiResourceIdentifier" },
        {
          type: "array",
          items: { $ref: "#/components/schemas/JsonApiResourceIdentifier" },
        },
        { type: "null" } as JsonApiSchemaObject,
      ],
      description: "Resource linkage (single, array, or null)",
    } as JsonApiSchemaObject,
    links: {
      type: "object",
      properties: {
        self: { type: "string", format: "uri" },
        related: { type: "string", format: "uri" },
      },
    },
    meta: {
      type: "object",
      additionalProperties: true,
    },
  },
};

/**
 * JSON:API Links object schema.
 */
export const JsonApiLinksSchema: JsonApiSchemaObject = {
  type: "object",
  properties: {
    self: {
      type: "string",
      format: "uri",
      description: "Link to this resource",
      example: "/api/photographs/abc123",
    },
    first: {
      type: "string",
      format: "uri",
      description: "First page of results",
    },
    prev: {
      oneOf: [{ type: "string", format: "uri" }, { type: "null" }],
      description: "Previous page of results",
    } as JsonApiSchemaObject,
    next: {
      oneOf: [{ type: "string", format: "uri" }, { type: "null" }],
      description: "Next page of results",
    } as JsonApiSchemaObject,
    last: {
      type: "string",
      format: "uri",
      description: "Last page of results",
    },
  },
};

/**
 * JSON:API Pagination Meta schema.
 */
export const JsonApiPaginationMetaSchema: JsonApiSchemaObject = {
  type: "object",
  properties: {
    total: {
      type: "integer" as "string",
      description: "Total number of records",
      example: 150,
    },
    offset: {
      type: "integer" as "string",
      description: "Current offset (number of records skipped)",
      example: 0,
    },
    size: {
      type: "integer" as "string",
      description: "Page size (number of records per page)",
      example: 20,
    },
  },
};

/**
 * Creates a JSON:API single resource response schema.
 */
export function createSingleResourceResponseSchema(entitySchemaRef: string): JsonApiSchemaObject {
  return {
    type: "object",
    required: ["data"],
    properties: {
      data: { $ref: entitySchemaRef },
      links: { $ref: "#/components/schemas/JsonApiLinks" },
      included: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: true,
        },
        description: "Included related resources (sideloaded)",
      },
    },
  };
}

/**
 * Creates a JSON:API collection response schema.
 */
export function createCollectionResponseSchema(entitySchemaRef: string): JsonApiSchemaObject {
  return {
    type: "object",
    required: ["data"],
    properties: {
      data: {
        type: "array",
        items: { $ref: entitySchemaRef },
      },
      links: { $ref: "#/components/schemas/JsonApiLinks" },
      meta: { $ref: "#/components/schemas/JsonApiPaginationMeta" },
      included: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: true,
        },
        description: "Included related resources (sideloaded)",
      },
    },
  };
}

/**
 * Returns all base JSON:API schemas to register with Swagger.
 */
export function getBaseJsonApiSchemas(): Record<string, JsonApiSchemaObject> {
  return {
    JsonApiResourceIdentifier: JsonApiResourceIdentifierSchema,
    JsonApiRelationship: JsonApiRelationshipSchema,
    JsonApiLinks: JsonApiLinksSchema,
    JsonApiPaginationMeta: JsonApiPaginationMetaSchema,
  };
}
