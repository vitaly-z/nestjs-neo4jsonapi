import { EntityDescriptor, FieldDef, RelationshipDef } from "../../common/interfaces/entity.schema.interface";
import { cypherTypeToOpenApi } from "../utils/cypher-to-openapi.util";
import { JsonApiSchemaObject } from "../schemas/jsonapi-base.schemas";

/**
 * Result of creating request body schemas.
 */
export interface RequestSchemas {
  /** POST request body schema (id optional) */
  createRequest: JsonApiSchemaObject;
  /** PUT request body schema (id required) */
  updateRequest: JsonApiSchemaObject;
  /** PATCH request body schema (all fields optional) */
  patchRequest: JsonApiSchemaObject;
  /** Schema name prefix for registration */
  schemaName: string;
}

/**
 * Creates POST/PUT/PATCH request body schemas from an EntityDescriptor.
 */
export function createRequestSchemas<T, R extends Record<string, RelationshipDef>>(
  descriptor: EntityDescriptor<T, R>,
): RequestSchemas {
  const schemaName = pascalCase(descriptor.model.type);
  const writableFields = getWritableFields(descriptor);

  // Attributes for POST (required fields must be present)
  const createAttributesSchema: JsonApiSchemaObject = {
    type: "object",
    required: descriptor.requiredFields.filter((f) => writableFields.includes(f)),
    properties: buildWritableFieldProperties(descriptor, writableFields),
  };

  // Attributes for PUT (all fields, required ones must be present)
  const updateAttributesSchema: JsonApiSchemaObject = {
    type: "object",
    required: descriptor.requiredFields.filter((f) => writableFields.includes(f)),
    properties: buildWritableFieldProperties(descriptor, writableFields),
  };

  // Attributes for PATCH (all fields optional)
  const patchAttributesSchema: JsonApiSchemaObject = {
    type: "object",
    properties: buildWritableFieldProperties(descriptor, writableFields),
  };

  const relationshipsSchema = buildRequestRelationshipsSchema(descriptor);

  // POST request body
  const createRequest: JsonApiSchemaObject = {
    type: "object",
    required: ["data"],
    properties: {
      data: {
        type: "object",
        required: ["type", "attributes"],
        properties: {
          type: {
            type: "string",
            example: descriptor.model.type,
          },
          id: {
            type: "string",
            description: "Optional client-generated ID",
          },
          attributes: createAttributesSchema,
          relationships: relationshipsSchema,
        },
      },
    },
  };

  // PUT request body
  const updateRequest: JsonApiSchemaObject = {
    type: "object",
    required: ["data"],
    properties: {
      data: {
        type: "object",
        required: ["type", "id", "attributes"],
        properties: {
          type: {
            type: "string",
            example: descriptor.model.type,
          },
          id: {
            type: "string",
            description: "Resource ID (must match URL)",
          },
          attributes: updateAttributesSchema,
          relationships: relationshipsSchema,
        },
      },
    },
  };

  // PATCH request body
  const patchRequest: JsonApiSchemaObject = {
    type: "object",
    required: ["data"],
    properties: {
      data: {
        type: "object",
        required: ["type", "id"],
        properties: {
          type: {
            type: "string",
            example: descriptor.model.type,
          },
          id: {
            type: "string",
            description: "Resource ID (must match URL)",
          },
          attributes: patchAttributesSchema,
          relationships: relationshipsSchema,
        },
      },
    },
  };

  return {
    createRequest,
    updateRequest,
    patchRequest,
    schemaName,
  };
}

/**
 * Gets writable field names (excludes computed fields).
 */
function getWritableFields<T, R extends Record<string, RelationshipDef>>(descriptor: EntityDescriptor<T, R>): string[] {
  return Object.keys(descriptor.fields).filter((fieldName) => !descriptor.computed?.[fieldName as keyof T]);
}

/**
 * Builds properties for writable fields.
 */
function buildWritableFieldProperties<T, R extends Record<string, RelationshipDef>>(
  descriptor: EntityDescriptor<T, R>,
  writableFields: string[],
): Record<string, JsonApiSchemaObject> {
  const properties: Record<string, JsonApiSchemaObject> = {};

  for (const fieldName of writableFields) {
    const fieldDef = descriptor.fields[fieldName as keyof T] as FieldDef | undefined;
    if (!fieldDef) continue;

    properties[fieldName] = cypherTypeToOpenApi(fieldDef.type) as JsonApiSchemaObject;
  }

  return properties;
}

/**
 * Builds relationships schema for request bodies.
 */
function buildRequestRelationshipsSchema<T, R extends Record<string, RelationshipDef>>(
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
            : { $ref: "#/components/schemas/JsonApiResourceIdentifier" },
      },
    };
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
