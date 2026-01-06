import { applyDecorators } from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiUnprocessableEntityResponse,
  ApiInternalServerErrorResponse,
} from "@nestjs/swagger";

/**
 * Options for @ApiJsonApiErrors decorator.
 */
export interface ApiJsonApiErrorsOptions {
  badRequest?: boolean;
  unauthorized?: boolean;
  forbidden?: boolean;
  notFound?: boolean;
  unprocessable?: boolean;
  serverError?: boolean;
}

/**
 * Decorator that adds common JSON:API error responses to an endpoint.
 * By default adds 401 (Unauthorized) and 500 (Server Error).
 *
 * @example
 * @ApiJsonApiErrors()
 * @Get()
 * findAll() { ... }
 *
 * @example
 * @ApiJsonApiErrors({ notFound: true })
 * @Get(':id')
 * findById() { ... }
 */
export function ApiJsonApiErrors(options: ApiJsonApiErrorsOptions = {}): MethodDecorator {
  const {
    badRequest = false,
    unauthorized = true,
    forbidden = false,
    notFound = false,
    unprocessable = false,
    serverError = true,
  } = options;

  const decorators: MethodDecorator[] = [];

  if (badRequest) {
    decorators.push(
      ApiBadRequestResponse({
        description: "Bad Request - Invalid request parameters",
        schema: { $ref: "#/components/schemas/JsonApi400ErrorResponse" },
      }),
    );
  }

  if (unauthorized) {
    decorators.push(
      ApiUnauthorizedResponse({
        description: "Unauthorized - Valid JWT token required",
        schema: { $ref: "#/components/schemas/JsonApi401ErrorResponse" },
      }),
    );
  }

  if (forbidden) {
    decorators.push(
      ApiForbiddenResponse({
        description: "Forbidden - Insufficient permissions",
        schema: { $ref: "#/components/schemas/JsonApi403ErrorResponse" },
      }),
    );
  }

  if (notFound) {
    decorators.push(
      ApiNotFoundResponse({
        description: "Not Found - Resource does not exist",
        schema: { $ref: "#/components/schemas/JsonApi404ErrorResponse" },
      }),
    );
  }

  if (unprocessable) {
    decorators.push(
      ApiUnprocessableEntityResponse({
        description: "Unprocessable Entity - Validation failed",
        schema: { $ref: "#/components/schemas/JsonApi422ErrorResponse" },
      }),
    );
  }

  if (serverError) {
    decorators.push(
      ApiInternalServerErrorResponse({
        description: "Internal Server Error",
        schema: { $ref: "#/components/schemas/JsonApi500ErrorResponse" },
      }),
    );
  }

  return applyDecorators(...decorators);
}

/**
 * Convenience decorator for read endpoints (GET by ID).
 * Adds 401, 404, and 500 error responses.
 */
export function ApiJsonApiReadErrors(): MethodDecorator {
  return ApiJsonApiErrors({ notFound: true });
}

/**
 * Convenience decorator for list endpoints (GET all).
 * Adds 401 and 500 error responses.
 */
export function ApiJsonApiListErrors(): MethodDecorator {
  return ApiJsonApiErrors();
}

/**
 * Convenience decorator for create endpoints (POST).
 * Adds 400, 401, 422, and 500 error responses.
 */
export function ApiJsonApiCreateErrors(): MethodDecorator {
  return ApiJsonApiErrors({ badRequest: true, unprocessable: true });
}

/**
 * Convenience decorator for update endpoints (PUT/PATCH).
 * Adds 400, 401, 404, 422, and 500 error responses.
 */
export function ApiJsonApiUpdateErrors(): MethodDecorator {
  return ApiJsonApiErrors({
    badRequest: true,
    notFound: true,
    unprocessable: true,
  });
}

/**
 * Convenience decorator for delete endpoints (DELETE).
 * Adds 401, 403, 404, and 500 error responses.
 */
export function ApiJsonApiDeleteErrors(): MethodDecorator {
  return ApiJsonApiErrors({ forbidden: true, notFound: true });
}
