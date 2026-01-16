/**
 * Mock Module Model for testing
 */
import { DataModelInterface } from "@carlonicora/nestjs-neo4jsonapi";
import { Module } from "./module.entity";
import { moduleMeta } from "./module.meta";

export const ModuleModel: DataModelInterface<Module> = {
  ...moduleMeta,
  entity: undefined as unknown as Module,
  mapper: (params: any) => ({
    ...params.data,
    name: params.data.name,
    permissions: params.data.permissions ?? {},
  }),
  serialiser: {} as any, // Mock serialiser
  childrenTokens: [],
};
