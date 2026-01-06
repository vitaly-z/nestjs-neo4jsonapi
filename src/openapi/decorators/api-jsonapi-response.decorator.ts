import { applyDecorators } from "@nestjs/common";
import { ApiOkResponse, ApiCreatedResponse, ApiNoContentResponse } from "@nestjs/swagger";
import { EntityDescriptor, RelationshipDef } from "../../common/interfaces/entity.schema.interface";

/**
 * Options for @ApiJsonApiResponse decorator.
 */
export interface ApiJsonApiResponseOptions {
  /** If true, documents a collection response instead of single resource */
  isList?: boolean;
  /** HTTP status code (default: 200 for GET, 201 for POST) */
  status?: number;
  /** Custom description */
  description?: string;
  /** If true, response is 204 No Content */
  noContent?: boolean;
}

/**
 * Decorator that documents a JSON:API response for an endpoint.
 * Automatically generates the correct response schema based on EntityDescriptor.
 *
 * @example
 * // Single resource response
 * @ApiJsonApiResponse(PhotographDescriptor)
 * @Get(':id')
 * findById() { ... }
 *
 * @example
 * // Collection response
 * @ApiJsonApiResponse(PhotographDescriptor, { isList: true })
 * @Get()
 * findAll() { ... }
 *
 * @example
 * // Created response
 * @ApiJsonApiResponse(PhotographDescriptor, { status: 201 })
 * @Post()
 * create() { ... }
 */
export function ApiJsonApiResponse<T, R extends Record<string, RelationshipDef>>(
  descriptor: EntityDescriptor<T, R>,
  options: ApiJsonApiResponseOptions = {},
): MethodDecorator {
  const { isList = false, status, description, noContent = false } = options;

  if (noContent) {
    return applyDecorators(
      ApiNoContentResponse({
        description: description || "Operation completed successfully",
      }),
    );
  }

  const schemaName = pascalCase(descriptor.model.type);

  const defaultDescription = isList
    ? `Returns a list of ${descriptor.model.type}`
    : `Returns a single ${descriptor.model.type.slice(0, -1)}`;

  const ResponseDecorator = status === 201 ? ApiCreatedResponse : ApiOkResponse;

  // Build inline schema that references registered schemas
  const responseSchema = isList
    ? {
        type: "object" as const,
        required: ["data"],
        properties: {
          data: {
            type: "array" as const,
            items: { $ref: `#/components/schemas/${schemaName}` },
          },
          links: { $ref: "#/components/schemas/JsonApiLinks" },
          meta: { $ref: "#/components/schemas/JsonApiPaginationMeta" },
          included: {
            type: "array" as const,
            items: { type: "object" as const, additionalProperties: true },
          },
        },
      }
    : {
        type: "object" as const,
        required: ["data"],
        properties: {
          data: { $ref: `#/components/schemas/${schemaName}` },
          links: { $ref: "#/components/schemas/JsonApiLinks" },
          included: {
            type: "array" as const,
            items: { type: "object" as const, additionalProperties: true },
          },
        },
      };

  return applyDecorators(
    ResponseDecorator({
      description: description || defaultDescription,
      schema: responseSchema,
    }),
  );
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
