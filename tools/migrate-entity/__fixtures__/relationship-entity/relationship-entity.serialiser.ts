/**
 * RelationshipEntity Serialiser - Old-style serialiser file
 * Uses local entity models (Feature, Module) to test import type behavior
 */
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  AbstractJsonApiSerialiser,
  JsonApiSerialiserFactory,
} from "@carlonicora/nestjs-neo4jsonapi";
import { relationshipEntityMeta } from "./relationship-entity.meta";
import { FeatureModel } from "./feature.model";
import { ModuleModel } from "./module.model";

@Injectable()
export class RelationshipEntitySerialiser extends AbstractJsonApiSerialiser {
  constructor(
    serialiserFactory: JsonApiSerialiserFactory,
    configService: ConfigService,
  ) {
    super(serialiserFactory, configService);
  }

  get type(): string {
    return relationshipEntityMeta.endpoint;
  }

  create() {
    this.attributes = {
      name: "name",
      description: "description",
      isActive: "isActive",
    };

    this.relationships = {
      feature: {
        name: "features",
        data: this.serialiserFactory.create(FeatureModel),
      },
      module: {
        name: "modules",
        data: this.serialiserFactory.create(ModuleModel),
      },
    };

    return super.create();
  }
}
