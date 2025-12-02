import { AbstractJsonApiSerialiser } from "../../core/jsonapi/abstracts/abstract.jsonapi.serialiser";
import { JsonApiServiceInterface } from "../../core/jsonapi/interfaces/jsonapi.service.interface";

export function getEndpoint(modelGetter: () => DataModelInterface<any>): string {
  return modelGetter().endpoint;
}

export type SerialiserType = AbstractJsonApiSerialiser & JsonApiServiceInterface;

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
