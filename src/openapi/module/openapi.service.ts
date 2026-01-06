import { Injectable, Logger } from "@nestjs/common";
import { EntityDescriptor, RelationshipDef } from "../../common/interfaces/entity.schema.interface";
import { createEntitySchemas, EntitySchemas } from "../factories/entity-schema.factory";
import { createRequestSchemas, RequestSchemas } from "../factories/request-schema.factory";
import { getBaseJsonApiSchemas, JsonApiSchemaObject } from "../schemas/jsonapi-base.schemas";
import { getErrorResponseSchemas } from "../schemas/jsonapi-error.schemas";

/**
 * Registered entity with its generated schemas.
 */
interface RegisteredEntity {
  descriptor: EntityDescriptor<any, any>;
  entitySchemas: EntitySchemas;
  requestSchemas: RequestSchemas;
}

/**
 * Service that manages OpenAPI schema generation from EntityDescriptors.
 * Provides centralized schema registry for Swagger documentation.
 */
@Injectable()
export class OpenApiService {
  private readonly logger = new Logger(OpenApiService.name);
  private readonly registeredEntities: Map<string, RegisteredEntity> = new Map();
  private schemasCache: Record<string, JsonApiSchemaObject> | null = null;

  /**
   * Registers an EntityDescriptor and generates its OpenAPI schemas.
   * Call this for each entity you want documented.
   *
   * @example
   * openApiService.registerEntity(PhotographDescriptor);
   */
  registerEntity<T, R extends Record<string, RelationshipDef>>(descriptor: EntityDescriptor<T, R>): void {
    const type = descriptor.model.type;

    if (this.registeredEntities.has(type)) {
      this.logger.warn(`Entity '${type}' already registered, skipping`);
      return;
    }

    const entitySchemas = createEntitySchemas(descriptor);
    const requestSchemas = createRequestSchemas(descriptor);

    this.registeredEntities.set(type, {
      descriptor,
      entitySchemas,
      requestSchemas,
    });

    // Invalidate cache when new entity registered
    this.schemasCache = null;

    this.logger.debug(`Registered entity '${type}' with OpenAPI schemas`);
  }

  /**
   * Registers multiple EntityDescriptors at once.
   *
   * @example
   * openApiService.registerEntities([
   *   PhotographDescriptor,
   *   RollDescriptor,
   *   CollectionDescriptor,
   * ]);
   */
  registerEntities(descriptors: EntityDescriptor<any, any>[]): void {
    for (const descriptor of descriptors) {
      this.registerEntity(descriptor);
    }
    this.logger.log(`Registered ${descriptors.length} entities with OpenAPI`);
  }

  /**
   * Gets all registered schemas for Swagger document builder.
   * Includes base JSON:API schemas, error schemas, and all entity schemas.
   *
   * @returns Record of schema name to SchemaObject
   */
  getAllSchemas(): Record<string, JsonApiSchemaObject> {
    if (this.schemasCache) {
      return this.schemasCache;
    }

    const schemas: Record<string, JsonApiSchemaObject> = {
      // Base JSON:API schemas
      ...getBaseJsonApiSchemas(),
      // Error response schemas
      ...getErrorResponseSchemas(),
    };

    // Add entity schemas
    for (const [, registered] of this.registeredEntities) {
      const { entitySchemas, requestSchemas } = registered;

      // Resource schema
      schemas[entitySchemas.schemaName] = entitySchemas.resource;

      // Response schemas
      schemas[`${entitySchemas.schemaName}Response`] = entitySchemas.singleResponse;
      schemas[`${entitySchemas.schemaName}CollectionResponse`] = entitySchemas.collectionResponse;

      // Request body schemas
      schemas[`Create${requestSchemas.schemaName}Request`] = requestSchemas.createRequest;
      schemas[`Update${requestSchemas.schemaName}Request`] = requestSchemas.updateRequest;
      schemas[`Patch${requestSchemas.schemaName}Request`] = requestSchemas.patchRequest;
    }

    this.schemasCache = schemas;
    return schemas;
  }

  /**
   * Gets schemas for a specific entity type.
   */
  getEntitySchemas(type: string): RegisteredEntity | undefined {
    return this.registeredEntities.get(type);
  }

  /**
   * Gets all registered entity types.
   */
  getRegisteredTypes(): string[] {
    return Array.from(this.registeredEntities.keys());
  }

  /**
   * Checks if an entity type is registered.
   */
  isRegistered(type: string): boolean {
    return this.registeredEntities.has(type);
  }

  /**
   * Gets the count of registered entities.
   */
  getRegisteredCount(): number {
    return this.registeredEntities.size;
  }
}
