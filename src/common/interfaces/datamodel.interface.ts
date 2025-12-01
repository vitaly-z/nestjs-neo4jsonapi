/**
 * Serialiser type - to be implemented by consuming apps
 * This is a placeholder that allows type-safe serialiser references
 */
export interface JsonApiSerialiserInterface {
  serialize(data: any): any;
}

export function getEndpoint(modelGetter: () => DataModelInterface<any>): string {
  return modelGetter().endpoint;
}

export type SerialiserType = JsonApiSerialiserInterface;

export type DataMeta = {
  type: string;
  endpoint: string;
  nodeName: string;
  labelName: string;
};

export type DataModelInterface<T> = DataMeta & {
  entity: T;
  mapper: (params: { data: any; record: any; entityFactory: any; name?: string }) => T;
  serialiser?: new (...args: any[]) => SerialiserType;
  childrenTokens?: string[];
  singleChildrenTokens?: string[];
  dynamicChildrenPatterns?: string[];
  dynamicSingleChildrenPatterns?: string[];
};
