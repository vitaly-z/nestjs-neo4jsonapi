import { zodToJsonSchema } from "zod-to-json-schema";

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
 * Uses the same library that LangChain uses internally for consistency.
 *
 * @param zodSchema - The Zod schema to convert
 * @returns JSON Schema object
 */
export function convertZodToJsonSchema(zodSchema: any): any {
  return zodToJsonSchema(zodSchema, {
    $refStrategy: "none", // Avoid references for simplicity
    target: "openApi3", // Use OpenAPI 3.0 format (compatible with OpenAI)
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
