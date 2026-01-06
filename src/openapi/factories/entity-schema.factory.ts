import { EntityDescriptor, FieldDef, RelationshipDef } from "../../common/interfaces/entity.schema.interface";
import { cypherTypeToOpenApi } from "../utils/cypher-to-openapi.util";
import { generateExampleAttributes } from "../utils/example-generator.util";
import { JsonApiSchemaObject } from "../schemas/jsonapi-base.schemas";

/**
 * Result of creating entity schemas - includes resource schema and response wrappers.
 */
export interface EntitySchemas {
  /** The core resource schema (type, id, attributes, relationships) */
  resource: JsonApiSchemaObject;
  /** Single resource response wrapper */
  singleResponse: JsonApiSchemaObject;
  /** Collection response wrapper */
  collectionResponse: JsonApiSchemaObject;
  /** Schema name for registration (e.g., 'Photograph') */
  schemaName: string;
}

/**
 * Creates OpenAPI schemas from an EntityDescriptor.
 * Generates resource schema, single response, and collection response schemas.
 */
export function createEntitySchemas<T, R extends Record<string, RelationshipDef>>(
  descriptor: EntityDescriptor<T, R>,
): EntitySchemas {
  const schemaName = pascalCase(descriptor.model.type);
  const attributesSchema = createAttributesSchema(descriptor);
  const relationshipsSchema = createRelationshipsSchema(descriptor);
  const exampleAttributes = generateExampleAttributes(descriptor.fields as Record<string, FieldDef>);

  // Resource schema (what appears in data or included)
  const resource: JsonApiSchemaObject = {
    type: "object",
    required: ["type", "id"],
    properties: {
      type: {
        type: "string",
        example: descriptor.model.type,
        description: "JSON:API resource type",
      },
      id: {
        type: "string",
        example: "abc123-def456",
        description: "Unique resource identifier",
      },
      attributes: attributesSchema,
      relationships: relationshipsSchema,
      links: {
        type: "object",
        properties: {
          self: {
            type: "string",
            format: "uri",
            example: `/${descriptor.model.endpoint}/abc123-def456`,
          },
        },
      },
    },
    example: {
      type: descriptor.model.type,
      id: "abc123-def456",
      attributes: exampleAttributes,
      links: {
        self: `/${descriptor.model.endpoint}/abc123-def456`,
      },
    },
  };

  // Single resource response
  const singleResponse: JsonApiSchemaObject = {
    type: "object",
    required: ["data"],
    properties: {
      data: { $ref: `#/components/schemas/${schemaName}` },
      links: { $ref: "#/components/schemas/JsonApiLinks" },
      included: {
        type: "array",
        items: { type: "object", additionalProperties: true },
        description: "Sideloaded related resources",
      },
    },
  };

  // Collection response
  const collectionResponse: JsonApiSchemaObject = {
    type: "object",
    required: ["data"],
    properties: {
      data: {
        type: "array",
        items: { $ref: `#/components/schemas/${schemaName}` },
      },
      links: { $ref: "#/components/schemas/JsonApiLinks" },
      meta: { $ref: "#/components/schemas/JsonApiPaginationMeta" },
      included: {
        type: "array",
        items: { type: "object", additionalProperties: true },
        description: "Sideloaded related resources",
      },
    },
  };

  return {
    resource,
    singleResponse,
    collectionResponse,
    schemaName,
  };
}

/**
 * Creates the attributes schema from entity fields and computed fields.
 */
function createAttributesSchema<T, R extends Record<string, RelationshipDef>>(
  descriptor: EntityDescriptor<T, R>,
): JsonApiSchemaObject {
  const properties: Record<string, JsonApiSchemaObject> = {};
  const required: string[] = [];

  // Add regular fields
  for (const [fieldName, fieldDef] of Object.entries(descriptor.fields)) {
    if (!fieldDef) continue;

    const typedFieldDef = fieldDef as FieldDef;
    const openApiType = cypherTypeToOpenApi(typedFieldDef.type);
    properties[fieldName] = {
      ...openApiType,
      description:
        `${typedFieldDef.required ? "Required. " : ""}${typedFieldDef.meta ? "Appears in meta." : ""}`.trim() ||
        undefined,
    };

    if (typedFieldDef.required) {
      required.push(fieldName);
    }
  }

  // Add computed fields (they're always read-only)
  if (descriptor.computed) {
    for (const [fieldName, computedDef] of Object.entries(descriptor.computed)) {
      if (!computedDef) continue;

      properties[fieldName] = {
        type: "string",
        description: "Computed field (calculated at runtime)",
      };
    }
  }

  return {
    type: "object",
    required: required.length > 0 ? required : undefined,
    properties,
  };
}

/**
 * Creates the relationships schema from entity relationship definitions.
 */
function createRelationshipsSchema<T, R extends Record<string, RelationshipDef>>(
  descriptor: EntityDescriptor<T, R>,
): JsonApiSchemaObject {
  const properties: Record<string, JsonApiSchemaObject> = {};

  for (const [relName, relDef] of Object.entries(descriptor.relationships)) {
    if (!relDef) continue;

    const typedRelDef = relDef as RelationshipDef;
    const dtoKey = typedRelDef.dtoKey || relName;

    properties[dtoKey] = {
      type: "object",
      properties: {
        data:
          typedRelDef.cardinality === "many"
            ? {
                type: "array",
                items: { $ref: "#/components/schemas/JsonApiResourceIdentifier" },
              }
            : {
                oneOf: [{ $ref: "#/components/schemas/JsonApiResourceIdentifier" }, { type: "null" }],
              },
        links: {
          type: "object",
          properties: {
            related: { type: "string", format: "uri" },
          },
        },
      },
      description: `Related ${typedRelDef.model.type} (${typedRelDef.cardinality})`,
    };
  }

  if (Object.keys(properties).length === 0) {
    return { type: "object", properties: {} };
  }

  return {
    type: "object",
    properties,
  };
}

/**
 * Converts a string to PascalCase.
 */
function pascalCase(str: string): string {
  return str
    .split(/[-_\s]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join("");
}
