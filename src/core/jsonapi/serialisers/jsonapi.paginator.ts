import * as qs from "qs";
import { JsonApiCursorInterface } from "../interfaces/jsonapi.cursor.interface";
import { JsonApiPaginationInterface } from "../interfaces/jsonapi.pagination.interface";
import { JsonApiIncludedFields } from "../types/JsonApiIncludedFields";

export class JsonApiPaginator {
  private _paginationCount = 25;
  private _pagination: JsonApiPaginationInterface = {
    size: this._paginationCount,
    offset: 0,
    offsetNext: undefined,
    offsetPrevious: undefined,
    forcedNext: undefined,
  };
  private _additionalParams: string = "";

  private _includedType: string[] = [];
  private _includedFields: JsonApiIncludedFields[] = [];
  private _includeSpecified: boolean = false;
  private _fetchAll: boolean = false;

  constructor(query?: any) {
    if (!query) return;

    const parsedQuery: any = qs.parse(query);

    if (parsedQuery?.include !== undefined) {
      this._includeSpecified = true;
      if (parsedQuery.include) {
        parsedQuery.include.split(",").forEach((type: string) => {
          this._includedType.push(type);
        });
      }
    }

    if (parsedQuery?.fields) {
      Object.entries(parsedQuery.fields).forEach(([key, value]: [string, unknown]) => {
        this._includedFields.push({ type: key, fields: (value as string).split(",") });
      });
    }

    if (parsedQuery.page?.size) this._pagination.size = +parsedQuery.page.size;
    if (parsedQuery.page?.offset) this._pagination.offset = +parsedQuery.page.offset;
    if (parsedQuery.page?.forcedNext) this._pagination.forcedNext = parsedQuery.page.forcedNext;
    if (parsedQuery.fetchAll === "true" || parsedQuery.fetchAll === true) this._fetchAll = true;

    this._additionalParams = Object.keys(query)
      .filter(
        (key) =>
          key !== "page[size]" &&
          key !== "page[offset]" &&
          key !== "page[before]" &&
          key !== "page[after]" &&
          (typeof query[key] !== "object" || query[key] === null),
      )
      .map((key) => `${key}=${query[key]}`)
      .join("&");

    if (this._additionalParams.length > 0) this._additionalParams = "&" + this._additionalParams;
  }

  set forceNext(forceNext: string) {
    this._pagination.forcedNext = forceNext;
  }

  generateLinks(data: any[], url: string): { self: string; next?: string; previous?: string } {
    if (this._fetchAll) {
      return { self: url };
    }

    const response = {
      self: "",
      next: undefined,
      previous: undefined,
    };

    this.updatePagination(data);
    if (!this._pagination.size) this._pagination.size = this._paginationCount;

    // Check if URL already has query parameters (from CLS request URL)
    // If so, don't append _additionalParams as they're already in the URL
    const urlHasQueryParams = url.includes("?");

    if (data.length === this.size) {
      const urlSelf = new URL(url);
      urlSelf.searchParams.set("page[size]", this._pagination.size.toString());
      urlSelf.searchParams.delete("page[offset]");
      response.self = urlSelf.toString().replace(/%5B/g, "[").replace(/%5D/g, "]").replace(/%2C/g, ",");

      if (this._additionalParams && !urlHasQueryParams) response.self += this._additionalParams;

      if (this._pagination.forcedNext) {
        const urlNext = new URL(url);
        urlNext.searchParams.set("page[size]", this._pagination.size.toString());
        urlNext.searchParams.set("page[offset]", this._pagination.forcedNext);
        response.next = urlNext.toString().replace(/%5B/g, "[").replace(/%5D/g, "]").replace(/%2C/g, ",");
        if (this._additionalParams && !urlHasQueryParams) response.next += this._additionalParams;
      } else if (this._pagination.offsetNext) {
        const urlNext = new URL(url);
        urlNext.searchParams.set("page[size]", this._pagination.size.toString());
        urlNext.searchParams.set("page[offset]", this._pagination.offsetNext.toString());
        response.next = urlNext.toString().replace(/%5B/g, "[").replace(/%5D/g, "]").replace(/%2C/g, ",");
        if (this._additionalParams && !urlHasQueryParams) response.next += this._additionalParams;
      }

      data.splice(this._pagination.size, 1);
    }

    if (this._pagination.offsetPrevious) {
      const urlPrev = new URL(url);
      urlPrev.searchParams.set("page[size]", this._pagination.size.toString());
      urlPrev.searchParams.set("page[offset]", (this._pagination.offset - this._pagination.size).toString());
      response.previous = urlPrev.toString().replace(/%5B/g, "[").replace(/%5D/g, "]").replace(/%2C/g, ",");
      if (this._additionalParams && !urlHasQueryParams) response.previous += this._additionalParams;
    }

    return response;
  }

  updatePagination(data: any[]): void {
    const hasEnoughData = data.length >= this.size;

    if (!this._pagination.forcedNext) {
      if (hasEnoughData) this._pagination.offsetNext = (this._pagination.offset ?? 0) + this._pagination.size;
      if (this._pagination.offset) this._pagination.offsetPrevious = this._pagination.offset - this.size;
    }
  }

  get paginationCount(): number {
    return this._paginationCount;
  }

  get size(): number {
    return (this._pagination?.size ?? this._paginationCount) + 1;
  }

  get pagination(): JsonApiPaginationInterface {
    return this._pagination;
  }

  get includedFields(): JsonApiIncludedFields[] {
    return this._includedFields;
  }

  get includedType(): string[] {
    return this._includedType;
  }

  get includeSpecified(): boolean {
    return this._includeSpecified;
  }

  get fetchAll(): boolean {
    return this._fetchAll;
  }

  generateCursor(): JsonApiCursorInterface | undefined {
    if (this._fetchAll) {
      return undefined;
    }

    const cursor: JsonApiCursorInterface = {
      cursor: this._pagination.offset,
      take: this.size,
    };

    return cursor;
  }
}
