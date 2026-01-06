import { applyDecorators } from "@nestjs/common";
import { ApiQuery } from "@nestjs/swagger";

/**
 * Decorator that documents standard JSON:API list query parameters.
 * Adds documentation for: page[offset], page[size], orderBy, fetchAll, search
 *
 * @example
 * @ApiJsonApiListQuery()
 * @Get()
 * findAll(@Query() query: any) { ... }
 */
export function ApiJsonApiListQuery(): MethodDecorator {
  return applyDecorators(
    ApiQuery({
      name: "page[offset]",
      required: false,
      type: Number,
      description: "Number of records to skip (for pagination)",
      example: 0,
    }),
    ApiQuery({
      name: "page[size]",
      required: false,
      type: Number,
      description: "Number of records per page (default: 20, max: 100)",
      example: 20,
    }),
    ApiQuery({
      name: "orderBy",
      required: false,
      type: String,
      description: "Field to order by, prefix with - for descending (e.g., -createdAt)",
      example: "-createdAt",
    }),
    ApiQuery({
      name: "fetchAll",
      required: false,
      type: Boolean,
      description: "If true, returns all records without pagination (use with caution)",
      example: false,
    }),
    ApiQuery({
      name: "search",
      required: false,
      type: String,
      description: "Full-text search term",
    }),
  );
}

/**
 * Decorator that documents the JSON:API include parameter.
 * Allows specifying which relationships can be included.
 *
 * @example
 * @ApiJsonApiInclude(['roll', 'metadata', 'faces'])
 * @Get()
 * findAll(@Query('include') include?: string) { ... }
 */
export function ApiJsonApiInclude(allowedRelationships: string[]): MethodDecorator {
  return applyDecorators(
    ApiQuery({
      name: "include",
      required: false,
      type: String,
      description: `Comma-separated list of relationships to include. Allowed: ${allowedRelationships.join(", ")}`,
      example: allowedRelationships.slice(0, 2).join(","),
      schema: {
        type: "string",
        description: `Allowed values: ${allowedRelationships.join(", ")}`,
      },
    }),
  );
}

/**
 * Decorator that documents pagination query parameters only.
 * Use when you need pagination but not orderBy/search.
 *
 * @example
 * @ApiJsonApiPagination()
 * @Get()
 * findAll(@Query() query: any) { ... }
 */
export function ApiJsonApiPagination(): MethodDecorator {
  return applyDecorators(
    ApiQuery({
      name: "page[offset]",
      required: false,
      type: Number,
      description: "Number of records to skip",
      example: 0,
    }),
    ApiQuery({
      name: "page[size]",
      required: false,
      type: Number,
      description: "Number of records per page",
      example: 20,
    }),
  );
}

/**
 * Decorator for documenting filter parameters.
 *
 * @example
 * @ApiJsonApiFilter('status', ['active', 'pending', 'completed'])
 * @Get()
 * findAll(@Query('filter[status]') status?: string) { ... }
 */
export function ApiJsonApiFilter(
  fieldName: string,
  allowedValues?: string[],
  options: { description?: string; required?: boolean } = {},
): MethodDecorator {
  const queryName = `filter[${fieldName}]`;

  return applyDecorators(
    ApiQuery({
      name: queryName,
      required: options.required || false,
      type: String,
      description: options.description || `Filter by ${fieldName}`,
      ...(allowedValues && {
        enum: allowedValues,
        example: allowedValues[0],
      }),
    }),
  );
}
