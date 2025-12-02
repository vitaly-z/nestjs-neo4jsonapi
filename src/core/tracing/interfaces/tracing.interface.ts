export interface TracingContext {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
}

export interface SpanOptions {
  attributes?: Record<string, string | number | boolean>;
  events?: Array<{
    name: string;
    attributes?: Record<string, string | number | boolean>;
    timestamp?: number;
  }>;
}
