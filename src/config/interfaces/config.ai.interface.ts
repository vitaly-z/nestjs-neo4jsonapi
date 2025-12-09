export interface ConfigAiInterface {
  ai: {
    provider: string;
    apiKey: string;
    model: string;
    url: string;
    region?: string;
    secret?: string;
    instance?: string;
    apiVersion?: string;
    inputCostPer1MTokens: number;
    outputCostPer1MTokens: number;
  };
  transcriber: {
    provider: string;
    apiKey: string;
    model: string;
    url?: string;
    apiVersion?: string;
  };
  embedder: {
    provider: string;
    apiKey: string;
    url: string;
    model: string;
    instance?: string;
    apiVersion?: string;
    dimensions: number;
  };
}
