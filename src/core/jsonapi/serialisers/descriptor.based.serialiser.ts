import { Injectable } from "@nestjs/common";
import { ModuleRef } from "@nestjs/core";
import { EntityDescriptor, RelationshipDef } from "../../../common/interfaces/entity.schema.interface";
import { modelRegistry } from "../../../common/registries/registry";
import { AbstractJsonApiSerialiser } from "../abstracts/abstract.jsonapi.serialiser";
import { JsonApiSerialiserFactory } from "../factories/jsonapi.serialiser.factory";
import { JsonApiDataInterface } from "../interfaces/jsonapi.data.interface";
import { JsonApiServiceInterface } from "../interfaces/jsonapi.service.interface";

/**
 * Base class for auto-generated serialisers from EntityDescriptor.
 * Derives attributes, meta, and relationships from the descriptor configuration.
 *
 * Subclasses should call `setDescriptor()` in their constructor.
 */
@Injectable()
export class DescriptorBasedSerialiser extends AbstractJsonApiSerialiser implements JsonApiServiceInterface {
  protected descriptor: EntityDescriptor<any, any>;
  protected injectedServices: Record<string, any> = {};

  constructor(
    serialiserFactory: JsonApiSerialiserFactory,
    protected readonly moduleRef: ModuleRef,
  ) {
    super(serialiserFactory);
  }

  /**
   * Set the descriptor and inject required services.
   * Must be called by subclasses in their constructor.
   */
  protected setDescriptor(descriptor: EntityDescriptor<any, any>): void {
    this.descriptor = descriptor;

    // Inject requested services using ModuleRef
    for (const ServiceClass of descriptor.injectServices || []) {
      try {
        this.injectedServices[ServiceClass.name] = this.moduleRef.get(ServiceClass, { strict: false });
      } catch {
        // Service not available - transformer will receive undefined
        console.warn(`Service ${ServiceClass.name} not available for injection in serialiser`);
      }
    }
  }

  get type(): string {
    return this.descriptor.model.type;
  }

  create(): JsonApiDataInterface {
    // 1. Build attributes from fields (non-meta)
    const attributes: Record<string, any> = {};
    for (const [fieldName, fieldDef] of Object.entries(this.descriptor.fields || {})) {
      if (!fieldDef.meta) {
        if (fieldDef.transform) {
          // Wrap transformer with injected services
          const transformer = fieldDef.transform;
          const services = this.injectedServices;
          attributes[fieldName] = async (data: any) => {
            return await transformer(data, services);
          };
        } else {
          // Direct mapping
          attributes[fieldName] = fieldName;
        }
      }
    }
    this.attributes = attributes;

    // 2. Build meta from fields + computed (where meta: true)
    const meta: Record<string, any> = {};
    for (const [fieldName, fieldDef] of Object.entries(this.descriptor.fields || {})) {
      if (fieldDef.meta) {
        if (fieldDef.transform) {
          const transformer = fieldDef.transform;
          const services = this.injectedServices;
          meta[fieldName] = async (data: any) => {
            return await transformer(data, services);
          };
        } else {
          meta[fieldName] = fieldName;
        }
      }
    }
    for (const [fieldName, computedDef] of Object.entries(this.descriptor.computed || {})) {
      if (computedDef.meta) {
        // Computed value already calculated by mapper
        meta[fieldName] = fieldName;
      }
    }
    this.meta = meta;

    // 3. Build relationships - resolve Models from registry at serialisation time
    const relationships: Record<string, any> = {};
    for (const [relName, relDef] of Object.entries(this.descriptor.relationships) as [string, RelationshipDef][]) {
      // Get the related model from registry using nodeName
      const relatedModel = modelRegistry.get(relDef.model.nodeName);
      if (relatedModel) {
        const relationship: any = {
          data: this.serialiserFactory.create(relatedModel),
        };
        // Use dtoKey if provided (e.g., 'topics' instead of 'topic')
        if (relDef.dtoKey && relDef.dtoKey !== relName) {
          relationship.name = relDef.dtoKey;
        }
        relationships[relName] = relationship;
      }
    }
    this.relationships = relationships;

    return super.create();
  }
}
