import { SetMetadata } from "@nestjs/common";

export type ModuleDefinition = { module: string; allowVisitors?: boolean };

export const ModuleACL = (params: ModuleDefinition) => SetMetadata("moduleDefinition", params);
