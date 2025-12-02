import { Injectable, Type } from "@nestjs/common";
import { ModuleRef } from "@nestjs/core";
import { DataModelInterface } from "../../../common/interfaces/datamodel.interface";

// Re-export DataModelInterface for use in consuming modules
export { DataModelInterface };

// Helper type to extract instance type from serialiser
type SerialiserInstance<T extends DataModelInterface<any>> = T["serialiser"] extends new (...args: any[]) => infer R
  ? R
  : any;

@Injectable()
export class JsonApiSerialiserFactory {
  constructor(private readonly moduleRef: ModuleRef) {}

  create<T extends DataModelInterface<any>>(model: T, params?: any): SerialiserInstance<T> {
    if (!model.serialiser) {
      throw new Error("Serialiser not found on model");
    }

    const SerialiserClass = model.serialiser as Type<SerialiserInstance<T>>;

    const serialiserService = this.moduleRef.get<SerialiserInstance<T>>(SerialiserClass, { strict: false });

    if (!serialiserService) {
      throw new Error(`Serialiser service for ${SerialiserClass.name} not found in the container`);
    }

    if (
      params &&
      typeof serialiserService === "object" &&
      serialiserService &&
      "setParams" in serialiserService &&
      typeof (serialiserService as any).setParams === "function"
    ) {
      (serialiserService as any).setParams(params);
    }

    return serialiserService;
  }
}
