export type JsonApiServiceInterface = {
  get type(): string;
  get id(): string;
  get endpoint(): string;
  get endpointParameters(): string;

  create(): any;
};
