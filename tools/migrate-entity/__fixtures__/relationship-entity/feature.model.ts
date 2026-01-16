/**
 * Mock Feature Model for testing
 */
import { DataModelInterface } from "@carlonicora/nestjs-neo4jsonapi";
import { Feature } from "./feature.entity";
import { featureMeta } from "./feature.meta";

export const FeatureModel: DataModelInterface<Feature> = {
  ...featureMeta,
  entity: undefined as unknown as Feature,
  mapper: (params: any) => ({
    ...params.data,
    name: params.data.name,
    isCore: params.data.isCore ?? false,
  }),
  serialiser: {} as any, // Mock serialiser
  childrenTokens: [],
};
