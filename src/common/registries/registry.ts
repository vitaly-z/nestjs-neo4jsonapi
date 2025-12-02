import { DataModelInterface } from "../interfaces/datamodel.interface";

/**
 * ModelRegistry - Global singleton for model registration
 *
 * NOT @Injectable because it must be instantiated and populated with models
 * BEFORE NestJS bootstraps. Other services depend on models being registered first.
 */
export class ModelRegistry {
  private models = new Map<string, DataModelInterface<any>>();
  private labelNameIndex = new Map<string, DataModelInterface<any>>();
  private typeIndex = new Map<string, DataModelInterface<any>>();

  public register(model: DataModelInterface<any>): void {
    this.models.set(model.nodeName, model);
    this.labelNameIndex.set(model.labelName.toLowerCase(), model);
    this.typeIndex.set(model.type.toLowerCase(), model);
  }

  public get(nodeName: string): DataModelInterface<any> | undefined {
    const model = this.models.get(nodeName);
    return model;
  }

  public getByLabelName(labelName: string): DataModelInterface<any> | undefined {
    return this.labelNameIndex.get(labelName.toLowerCase());
  }

  public getByType(type: string): DataModelInterface<any> | undefined {
    return this.typeIndex.get(type.toLowerCase());
  }

  public resolveModel(identifier: string): DataModelInterface<any> | undefined {
    // Try exact nodeName match first (backward compatibility)
    let model = this.get(identifier);
    if (model) return model;

    // Try labelName match (case insensitive)
    model = this.getByLabelName(identifier);
    if (model) return model;

    // Try type match (case insensitive)
    model = this.getByType(identifier);
    if (model) return model;

    return undefined;
  }

  public getAllModels(): DataModelInterface<any>[] {
    return Array.from(this.models.values());
  }
}

/**
 * Global singleton instance - use this for model registration before bootstrap
 */
export const modelRegistry = new ModelRegistry();
