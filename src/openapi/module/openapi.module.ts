import { Global, Module } from "@nestjs/common";
import { OpenApiService } from "./openapi.service";

/**
 * OpenAPI module for JSON:API documentation.
 *
 * This is a global module - import once in your app module and
 * the OpenApiService will be available everywhere.
 *
 * @example
 * // In your main app module
 * @Module({
 *   imports: [OpenApiModule],
 * })
 * export class AppModule {}
 *
 * // In bootstrap or config
 * const openApiService = app.get(OpenApiService);
 * openApiService.registerEntities([...]);
 */
@Global()
@Module({
  providers: [OpenApiService],
  exports: [OpenApiService],
})
export class OpenApiModule {}
