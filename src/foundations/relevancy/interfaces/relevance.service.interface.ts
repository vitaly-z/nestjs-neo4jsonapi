import { DataModelInterface } from "../../../common/interfaces/datamodel.interface";
import { JsonApiDataInterface } from "../../../core/jsonapi/interfaces/jsonapi.data.interface";

export interface RelevanceServiceInterface {
  findRelevantByUser<T>(params: {
    model: DataModelInterface<T>;
    cypherService: any;
    userId: string;
    query?: any;
  }): Promise<JsonApiDataInterface>;

  findRelevant<T>(params: {
    model: DataModelInterface<T>;
    cypherService: any;
    id: string;
    query?: any;
  }): Promise<JsonApiDataInterface>;
}
