import { DataModelInterface } from "../../../common/interfaces/datamodel.interface";
import { JsonApiCursorInterface } from "../../../core/jsonapi/interfaces/jsonapi.cursor.interface";

export interface RelevanceRepositoryInterface<T> {
  findByUser(params: {
    model: DataModelInterface<T>;
    cypherService: any;
    id: string;
    cursor: JsonApiCursorInterface;
  }): Promise<T[]>;

  findById(params: {
    model: DataModelInterface<T>;
    cypherService: any;
    id: string;
    cursor: JsonApiCursorInterface;
  }): Promise<T[]>;
}
