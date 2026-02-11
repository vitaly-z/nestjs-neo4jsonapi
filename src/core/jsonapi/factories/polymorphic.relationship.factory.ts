import { Injectable } from "@nestjs/common";
import { DataMeta } from "../../../common/interfaces/datamodel.interface";
import { PolymorphicConfig, PolymorphicDiscriminatorData } from "../../../common/interfaces/entity.schema.interface";
import { modelRegistry } from "../../../common/registries/registry";
import { JsonApiSerialiserFactory } from "./jsonapi.serialiser.factory";

/**
 * Factory for resolving polymorphic relationships at serialization time.
 * Evaluates the discriminator function with entity data to determine
 * the correct JSON:API type for each related entity.
 */
@Injectable()
export class PolymorphicRelationshipFactory {
  constructor(
    private readonly serialiserFactory: JsonApiSerialiserFactory,
    private readonly polymorphicConfig: PolymorphicConfig,
  ) {}

  /**
   * Resolve the correct DataMeta for a related entity based on discriminator data.
   *
   * @param data - Entity data including properties, labels, and discriminator flags
   * @returns The resolved DataMeta for the entity
   */
  resolve(data: PolymorphicDiscriminatorData): DataMeta {
    return this.polymorphicConfig.discriminator(data);
  }

  /**
   * Get or create a serializer for the resolved model.
   *
   * @param resolvedMeta - The DataMeta resolved by the discriminator
   * @returns The serializer for the resolved model
   */
  getSerializer(resolvedMeta: DataMeta): any {
    const model = modelRegistry.get(resolvedMeta.nodeName);
    if (!model) {
      throw new Error(`Model not found in registry: ${resolvedMeta.nodeName}`);
    }
    return this.serialiserFactory.create(model);
  }

  /**
   * Create a dynamic relationship serializer for an entity.
   * This method is called by JsonApiService for each item in a polymorphic relationship.
   *
   * @param entity - The entity to serialize
   * @returns The appropriate serializer for this entity based on discriminator logic
   */
  createDynamicRelationship(entity: any): any {
    if (!entity) return null;

    const discriminatorData: PolymorphicDiscriminatorData = {
      properties: entity,
      labels: entity.labels || [],
      hasParent: entity._hasParent,
    };

    const resolvedMeta = this.resolve(discriminatorData);

    // If entity has _discTarget and we know the target property, assign it
    if (entity._discTarget && this.polymorphicConfig.discriminatorTargetProperty) {
      const targetProp = this.polymorphicConfig.discriminatorTargetProperty;
      entity[targetProp] = entity._discTarget;
      delete entity._discTarget;
    }

    // Clean up internal properties
    delete entity._hasParent;

    return this.getSerializer(resolvedMeta);
  }
}
