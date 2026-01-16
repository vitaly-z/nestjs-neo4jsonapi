/**
 * TestEntity - Old-style model file
 * This represents the OLD pattern before migration
 */

import { DataModelInterface } from "@carlonicora/nestjs-neo4jsonapi";
import { TestEntity } from "./test-entity";
import { testEntityMeta } from "./test-entity.meta";
import { testEntityMapper } from "./test-entity.map";
import { TestEntitySerialiser } from "./test-entity.serialiser";

export const TestEntityModel: DataModelInterface<TestEntity> = {
  ...testEntityMeta,
  mapper: testEntityMapper,
  serialiser: TestEntitySerialiser,
};
