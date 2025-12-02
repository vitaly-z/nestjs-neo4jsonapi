import { DataModelInterface } from "../../../common/interfaces/datamodel.interface";
import { Module } from "../../module/entities/module.entity";
import { mapModule } from "../../module/entities/module.map";
import { moduleMeta } from "../../module/entities/module.meta";
import { ModuleSerialiser } from "../../module/serialisers/module.serialiser";

export const ModuleModel: DataModelInterface<Module> = {
  ...moduleMeta,
  entity: undefined as unknown as Module,
  mapper: mapModule,
  serialiser: ModuleSerialiser,
};
