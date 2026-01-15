import * as z from "zod";

/**
 * Metadata extracted from a field in a Zod schema
 */
interface FieldMetadata {
  name: string;
  description?: string;
  type: string;
  properties?: Record<string, FieldMetadata>; // For nested objects
  items?: FieldMetadata; // For arrays
}

/**
 * Schema metadata with structured field information
 */
export interface SchemaMetadata {
  fields: Record<string, FieldMetadata>;
  description?: string;
}

/**
 * Converts a Zod schema to JSON Schema format
 *
 * Uses Zod 4's built-in z.toJSONSchema() for native conversion.
 *
 * @param zodSchema - The Zod schema to convert
 * @returns JSON Schema object
 */
export function convertZodToJsonSchema(zodSchema: any): any {
  // Use Zod 4's native JSON Schema conversion
  return z.toJSONSchema(zodSchema, {
    target: "openapi-3.0", // Use OpenAPI 3.0 format (compatible with OpenAI/Gemini)
    cycles: "ref", // Handle cycles with $defs
    unrepresentable: "any", // Unrepresentable types become {} instead of throwing
  });
}

/**
 * Extracts field metadata from JSON Schema
 *
 * Recursively processes JSON Schema properties to extract:
 * - Field names
 * - Field descriptions
 * - Field types
 * - Nested structures (objects, arrays)
 *
 * @param jsonSchema - JSON Schema object (typically from convertZodToJsonSchema)
 * @returns Structured metadata with field information
 */
function extractFieldMetadataFromJsonSchema(jsonSchema: any): Record<string, FieldMetadata> {
  const fields: Record<string, FieldMetadata> = {};

  if (!jsonSchema.properties) {
    return fields;
  }

  for (const [fieldName, fieldSchema] of Object.entries<any>(jsonSchema.properties)) {
    const metadata: FieldMetadata = {
      name: fieldName,
      description: fieldSchema.description,
      type: fieldSchema.type || "unknown",
    };

    // Handle nested objects
    if (fieldSchema.type === "object" && fieldSchema.properties) {
      metadata.properties = extractFieldMetadataFromJsonSchema(fieldSchema);
    }

    // Handle arrays
    if (fieldSchema.type === "array" && fieldSchema.items) {
      metadata.items = {
        name: "item",
        description: fieldSchema.items.description,
        type: fieldSchema.items.type || "unknown",
      };

      // Handle arrays of objects
      if (fieldSchema.items.type === "object" && fieldSchema.items.properties) {
        metadata.items.properties = extractFieldMetadataFromJsonSchema(fieldSchema.items);
      }
    }

    fields[fieldName] = metadata;
  }

  return fields;
}

/**
 * Extracts structured metadata from a Zod schema
 *
 * This function:
 * 1. Converts Zod schema to JSON Schema
 * 2. Extracts field names, types, and descriptions
 * 3. Returns structured metadata for prompt injection
 *
 * The extracted metadata can be used to:
 * - Generate schema-guided instructions
 * - Create input context prompts
 * - Validate input parameters
 *
 * @param zodSchema - The Zod schema to extract metadata from
 * @returns Structured metadata with field information
 *
 * @example
 * ```typescript
 * const schema = z.object({
 *   name: z.string().describe("The user's name"),
 *   age: z.number().describe("The user's age"),
 * });
 *
 * const metadata = extractSchemaMetadata(schema);
 * // {
 * //   fields: {
 * //     name: { name: "name", description: "The user's name", type: "string" },
 * //     age: { name: "age", description: "The user's age", type: "number" }
 * //   }
 * // }
 * ```
 */
export function extractSchemaMetadata(zodSchema: any): SchemaMetadata {
  const jsonSchema = convertZodToJsonSchema(zodSchema);

  return {
    fields: extractFieldMetadataFromJsonSchema(jsonSchema),
    description: jsonSchema.description,
  };
}

/**
 * Formats a single field value with its description for prompt injection
 *
 * Creates a natural-reading format that combines the field description
 * with its value, making it clear to the LLM what each input represents.
 *
 * @param fieldName - The name of the field
 * @param fieldValue - The value of the field
 * @param description - Optional description from the schema
 * @returns Formatted string for prompt injection
 *
 * @example Without description:
 * ```typescript
 * formatFieldWithDescription("name", "Alice")
 * // Returns: "name: Alice"
 * ```
 *
 * @example With description:
 * ```typescript
 * formatFieldWithDescription(
 *   "recentActions",
 *   ["smiles", "waves"],
 *   "FORBIDDEN actions - NEVER repeat these"
 * )
 * // Returns: "recentActions (FORBIDDEN actions - NEVER repeat these): [...]"
 * ```
 */
export function formatFieldWithDescription(fieldName: string, fieldValue: any, description?: string): string {
  // Format the value based on its type
  let formattedValue: string;
  if (fieldValue === null || fieldValue === undefined) {
    formattedValue = String(fieldValue);
  } else if (typeof fieldValue === "object") {
    // For objects/arrays, use JSON stringify with formatting
    // CRITICAL: Escape curly braces for ChatPromptTemplate
    // Single braces {} are interpreted as template variables
    // Double braces {{}} render as literal {} in the output
    formattedValue = JSON.stringify(fieldValue, null, 2).replace(/{/g, "{{").replace(/}/g, "}}");
  } else {
    // Escape braces in string values too
    formattedValue = String(fieldValue).replace(/{/g, "{{").replace(/}/g, "}}");
  }

  // Include description if available
  if (description) {
    return `${fieldName} (${description}): ${formattedValue}`;
  } else {
    return `${fieldName}: ${formattedValue}`;
  }
}

/**
 * Removes JSON Schema properties not supported by Gemini API.
 *
 * Gemini uses a subset of OpenAPI 3.0 schema that doesn't support:
 * - $schema, $id, $defs, $ref, $comment
 * - allOf, anyOf, oneOf (need flattening)
 *
 * This function recursively sanitizes a JSON Schema to make it Gemini-compatible.
 * Use this when calling Gemini models through proxies like Requesty that don't
 * automatically sanitize schemas.
 *
 * @param schema - JSON Schema object (typically from zodToJsonSchema or convertZodToJsonSchema)
 * @returns Sanitized schema compatible with Gemini API
 *
 * @example
 * ```typescript
 * const jsonSchema = convertZodToJsonSchema(myZodSchema);
 * const geminiSchema = sanitizeSchemaForGemini(jsonSchema);
 * // geminiSchema has no $schema, $defs, etc.
 * ```
 */
export function sanitizeSchemaForGemini(schema: any): any {
  if (!schema || typeof schema !== "object") return schema;

  // Handle arrays
  if (Array.isArray(schema)) {
    return schema.map((item) => sanitizeSchemaForGemini(item));
  }

  const sanitized = { ...schema };

  // Remove unsupported top-level properties
  const unsupportedProps = ["$schema", "$id", "$defs", "$ref", "$comment"];
  for (const prop of unsupportedProps) {
    delete sanitized[prop];
  }

  // Recursively sanitize nested objects in properties
  if (sanitized.properties) {
    sanitized.properties = Object.fromEntries(
      Object.entries(sanitized.properties).map(([key, value]) => [key, sanitizeSchemaForGemini(value)]),
    );
  }

  // Handle array items
  if (sanitized.items) {
    sanitized.items = sanitizeSchemaForGemini(sanitized.items);
  }

  // Handle allOf - merge all schemas into one
  if (Array.isArray(sanitized.allOf)) {
    for (const subSchema of sanitized.allOf) {
      const cleaned = sanitizeSchemaForGemini(subSchema);
      // Merge properties
      if (cleaned.properties) {
        sanitized.properties = { ...sanitized.properties, ...cleaned.properties };
      }
      // Merge required arrays (deduplicate)
      if (cleaned.required) {
        const merged = [...(sanitized.required || []), ...cleaned.required];
        sanitized.required = Array.from(new Set(merged));
      }
      // Copy type if not set
      if (cleaned.type && !sanitized.type) {
        sanitized.type = cleaned.type;
      }
    }
    delete sanitized.allOf;
  }

  // Handle anyOf/oneOf - use first option (simplified approach)
  for (const keyword of ["anyOf", "oneOf"]) {
    if (Array.isArray(sanitized[keyword]) && sanitized[keyword].length > 0) {
      const firstOption = sanitizeSchemaForGemini(sanitized[keyword][0]);
      // Merge the first option into sanitized
      if (firstOption.properties) {
        sanitized.properties = { ...sanitized.properties, ...firstOption.properties };
      }
      if (firstOption.required) {
        const merged = [...(sanitized.required || []), ...firstOption.required];
        sanitized.required = Array.from(new Set(merged));
      }
      if (firstOption.type && !sanitized.type) {
        sanitized.type = firstOption.type;
      }
      delete sanitized[keyword];
    }
  }

  // Recursively sanitize additionalProperties if it's an object schema
  if (sanitized.additionalProperties && typeof sanitized.additionalProperties === "object") {
    sanitized.additionalProperties = sanitizeSchemaForGemini(sanitized.additionalProperties);
  }

  return sanitized;
}
