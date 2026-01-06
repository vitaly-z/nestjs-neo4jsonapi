import { JsonApiSchemaObject } from "./jsonapi-base.schemas";

/**
 * JSON:API Error source schema.
 * Points to the source of the error in the request.
 */
export const JsonApiErrorSourceSchema: JsonApiSchemaObject = {
  type: "object",
  properties: {
    pointer: {
      type: "string",
      description: "JSON pointer to the value in request document",
      example: "/data/attributes/name",
    },
    parameter: {
      type: "string",
      description: "Query parameter that caused the error",
      example: "filter[status]",
    },
    header: {
      type: "string",
      description: "Name of the header that caused the error",
      example: "Authorization",
    },
  },
};

/**
 * JSON:API Error object schema.
 */
export const JsonApiErrorSchema: JsonApiSchemaObject = {
  type: "object",
  required: ["status", "title"],
  properties: {
    id: {
      type: "string",
      description: "Unique identifier for this occurrence",
      example: "err-abc123",
    },
    status: {
      type: "string",
      description: "HTTP status code as string",
      example: "400",
    },
    code: {
      type: "string",
      description: "Application-specific error code",
      example: "VALIDATION_ERROR",
    },
    title: {
      type: "string",
      description: "Short, human-readable summary",
      example: "Validation Error",
    },
    detail: {
      type: "string",
      description: "Detailed explanation of the error",
      example: "The name field is required and cannot be empty.",
    },
    source: { $ref: "#/components/schemas/JsonApiErrorSource" },
    meta: {
      type: "object",
      additionalProperties: true,
      description: "Additional error metadata",
    },
  },
};

/**
 * JSON:API Error Response schema.
 */
export const JsonApiErrorResponseSchema: JsonApiSchemaObject = {
  type: "object",
  required: ["errors"],
  properties: {
    errors: {
      type: "array",
      items: { $ref: "#/components/schemas/JsonApiError" },
      minItems: 1,
    },
    meta: {
      type: "object",
      additionalProperties: true,
    },
  },
};

/**
 * Creates common error response schemas for different HTTP status codes.
 */
export function getErrorResponseSchemas(): Record<string, JsonApiSchemaObject> {
  return {
    JsonApiErrorSource: JsonApiErrorSourceSchema,
    JsonApiError: JsonApiErrorSchema,
    JsonApiErrorResponse: JsonApiErrorResponseSchema,
    JsonApi400ErrorResponse: {
      allOf: [
        { $ref: "#/components/schemas/JsonApiErrorResponse" },
        {
          type: "object",
          example: {
            errors: [
              {
                status: "400",
                title: "Bad Request",
                detail: "Invalid request parameters",
              },
            ],
          },
        },
      ],
    },
    JsonApi401ErrorResponse: {
      allOf: [
        { $ref: "#/components/schemas/JsonApiErrorResponse" },
        {
          type: "object",
          example: {
            errors: [
              {
                status: "401",
                title: "Unauthorized",
                detail: "Authentication required",
              },
            ],
          },
        },
      ],
    },
    JsonApi403ErrorResponse: {
      allOf: [
        { $ref: "#/components/schemas/JsonApiErrorResponse" },
        {
          type: "object",
          example: {
            errors: [
              {
                status: "403",
                title: "Forbidden",
                detail: "You do not have permission to access this resource",
              },
            ],
          },
        },
      ],
    },
    JsonApi404ErrorResponse: {
      allOf: [
        { $ref: "#/components/schemas/JsonApiErrorResponse" },
        {
          type: "object",
          example: {
            errors: [
              {
                status: "404",
                title: "Not Found",
                detail: "The requested resource was not found",
              },
            ],
          },
        },
      ],
    },
    JsonApi422ErrorResponse: {
      allOf: [
        { $ref: "#/components/schemas/JsonApiErrorResponse" },
        {
          type: "object",
          example: {
            errors: [
              {
                status: "422",
                title: "Unprocessable Entity",
                detail: "Validation failed for the request",
                source: { pointer: "/data/attributes/name" },
              },
            ],
          },
        },
      ],
    },
    JsonApi500ErrorResponse: {
      allOf: [
        { $ref: "#/components/schemas/JsonApiErrorResponse" },
        {
          type: "object",
          example: {
            errors: [
              {
                status: "500",
                title: "Internal Server Error",
                detail: "An unexpected error occurred",
              },
            ],
          },
        },
      ],
    },
  };
}
