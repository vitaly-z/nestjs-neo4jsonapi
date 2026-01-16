/**
 * ComplexEntity - Old-style model file
 * This represents the OLD pattern before migration
 */

import { DataModelInterface } from "@carlonicora/nestjs-neo4jsonapi";
import { ComplexEntity } from "./complex-entity";
import { complexEntityMeta } from "./complex-entity.meta";
import { complexEntityMapper } from "./complex-entity.map";
import { ComplexEntitySerialiser } from "./complex-entity.serialiser";

export const ComplexEntityModel: DataModelInterface<ComplexEntity> = {
  ...complexEntityMeta,
  mapper: complexEntityMapper,
  serialiser: ComplexEntitySerialiser,
};
