/**
 * SimpleEntity - Old-style model file
 * This represents the OLD pattern before migration
 */

import { DataModelInterface } from "@carlonicora/nestjs-neo4jsonapi";
import { SimpleEntity } from "./simple-entity";
import { simpleEntityMeta } from "./simple-entity.meta";
import { simpleEntityMapper } from "./simple-entity.map";
import { SimpleEntitySerialiser } from "./simple-entity.serialiser";

export const SimpleEntityModel: DataModelInterface<SimpleEntity> = {
  ...simpleEntityMeta,
  mapper: simpleEntityMapper,
  serialiser: SimpleEntitySerialiser,
};
