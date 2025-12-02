import { Injectable } from "@nestjs/common";
import { modelRegistry } from "../../../common/registries/registry";
import { JsonApiSerialiserFactory } from "./jsonapi.serialiser.factory";

@Injectable()
export class DynamicRelationshipFactory {
  constructor(private readonly serialiserFactory: JsonApiSerialiserFactory) {}

  createDynamicRelationship(entity: any) {
    if (!modelRegistry) {
      return null;
    }

    // If no entity provided (during serializer setup), return placeholder using accounts model
    if (!entity) {
      const accountModel = modelRegistry.getByType("accounts");
      if (accountModel && accountModel.serialiser) {
        return this.serialiserFactory.create(accountModel);
      }
      return null;
    }

    // Try to resolve model based on entity type first
    let model = modelRegistry.getByType(entity.type);

    // If no model found by type, try by labels
    if (!model && entity.labels && Array.isArray(entity.labels)) {
      for (const label of entity.labels) {
        model = modelRegistry.resolveModel(label);
        if (model) break;
      }
    }

    // Fallback: try resolving by Neo4j labelName
    if (!model && entity.labels && Array.isArray(entity.labels)) {
      for (const label of entity.labels) {
        model = modelRegistry.getByLabelName(label);
        if (model) break;
      }
    }

    if (model && model.serialiser) {
      return this.serialiserFactory.create(model);
    }

    return null;
  }
}
