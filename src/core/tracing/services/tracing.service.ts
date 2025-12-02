import { Injectable } from "@nestjs/common";
import { context, SpanKind, SpanStatusCode, trace } from "@opentelemetry/api";
import { ClsService } from "nestjs-cls";
import { baseConfig } from "../../../config/base.config";
import { SpanOptions, TracingContext } from "../interfaces/tracing.interface";

@Injectable()
export class TracingService {
  private tracer: any;
  private isEnabled: boolean;
  private readonly tempoConfig = baseConfig.tempo;

  constructor(private readonly clsService: ClsService) {
    this.isEnabled = this.tempoConfig?.enabled || false;

    if (this.isEnabled) {
      this.tracer = trace.getTracer(this.tempoConfig.serviceName, this.tempoConfig.serviceVersion);
    }
  }

  /**
   * Start a new span
   */
  public startSpan(name: string, options: SpanOptions = {}): any {
    if (!this.isEnabled || !this.tracer) {
      return null;
    }

    const span = this.tracer.startSpan(name, {
      kind: SpanKind.INTERNAL,
      attributes: options.attributes || {},
    });

    // Add events if provided
    if (options.events) {
      options.events.forEach((event) => {
        span.addEvent(event.name, event.attributes || {}, event.timestamp);
      });
    }

    // Store in CLS context
    this.setCurrentSpan(span);

    return span;
  }

  /**
   * Start a child span from the current active span
   */
  public createChildSpan(name: string, options: SpanOptions = {}): any {
    if (!this.isEnabled || !this.tracer) {
      return null;
    }

    return context.with(trace.setSpan(context.active(), this.getActiveSpan()), () => {
      return this.startSpan(name, options);
    });
  }

  /**
   * Start a span for an HTTP request
   */
  public startHttpSpan(method: string, url: string, userIp?: string): any {
    if (!this.isEnabled) {
      return null;
    }

    const attributes: Record<string, string | number | boolean> = {
      "http.method": method,
      "http.url": url,
      component: "http",
    };

    if (userIp) {
      attributes["http.client_ip"] = userIp;
    }

    return this.startSpan(`${method} ${url}`, {
      attributes,
    });
  }

  /**
   * Add an attribute to the current active span
   */
  public addSpanAttribute(key: string, value: string | number | boolean): void {
    if (!this.isEnabled) {
      return;
    }

    const span = this.getActiveSpan();
    if (span) {
      span.setAttributes({ [key]: value });
    }
  }

  /**
   * Add multiple attributes to the current active span
   */
  public addSpanAttributes(attributes: Record<string, string | number | boolean>): void {
    if (!this.isEnabled) {
      return;
    }

    const span = this.getActiveSpan();
    if (span) {
      span.setAttributes(attributes);
    }
  }

  /**
   * Add an event to the current active span
   */
  public addSpanEvent(name: string, attributes?: Record<string, string | number | boolean>): void {
    if (!this.isEnabled) {
      return;
    }

    const span = this.getActiveSpan();
    if (span) {
      span.addEvent(name, attributes || {});
    }
  }

  /**
   * Set span status to error
   */
  public setSpanError(error: Error | string): void {
    if (!this.isEnabled) {
      return;
    }

    const span = this.getActiveSpan();
    if (span) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: typeof error === "string" ? error : error.message,
      });

      if (typeof error !== "string") {
        span.setAttributes({
          "error.name": error.name,
          "error.message": error.message,
          "error.stack": error.stack || "",
        });
      }
    }
  }

  /**
   * Set span status to OK
   */
  public setSpanSuccess(): void {
    if (!this.isEnabled) {
      return;
    }

    const span = this.getActiveSpan();
    if (span) {
      span.setStatus({ code: SpanStatusCode.OK });
    }
  }

  /**
   * End the current span
   */
  public endSpan(span?: any): void {
    if (!this.isEnabled) {
      return;
    }

    const spanToEnd = span || this.getActiveSpan();
    if (spanToEnd) {
      spanToEnd.end();
    }
  }

  /**
   * Get the current trace ID
   */
  public getCurrentTraceId(): string | undefined {
    if (!this.isEnabled) {
      return undefined;
    }

    const span = this.getActiveSpan();
    if (span) {
      const spanContext = span.spanContext();
      return spanContext.traceId;
    }

    return undefined;
  }

  /**
   * Get the current span ID
   */
  public getCurrentSpanId(): string | undefined {
    if (!this.isEnabled) {
      return undefined;
    }

    const span = this.getActiveSpan();
    if (span) {
      const spanContext = span.spanContext();
      return spanContext.spanId;
    }

    return undefined;
  }

  /**
   * Get the current tracing context
   */
  public getCurrentTracingContext(): TracingContext | undefined {
    if (!this.isEnabled) {
      return undefined;
    }

    const traceId = this.getCurrentTraceId();
    const spanId = this.getCurrentSpanId();

    if (traceId && spanId) {
      return {
        traceId,
        spanId,
      };
    }

    return undefined;
  }

  /**
   * Get the active span from context
   */
  public getActiveSpan(): any {
    if (!this.isEnabled) {
      return null;
    }

    // Try to get from CLS context first
    if (this.clsService) {
      const clsSpan = this.clsService.get("currentSpan");
      if (clsSpan) {
        return clsSpan;
      }
    }

    // Fall back to OpenTelemetry context
    return trace.getActiveSpan();
  }

  /**
   * Set the current span in CLS context
   */
  private setCurrentSpan(span: any): void {
    if (this.isEnabled && span && this.clsService) {
      this.clsService.set("currentSpan", span);
    }
  }

  /**
   * Execute a function within a span context
   */
  public withSpan<T>(name: string, fn: (span: any) => T, options: SpanOptions = {}): T {
    if (!this.isEnabled) {
      return fn(null);
    }

    const span = this.startSpan(name, options);

    try {
      const result = fn(span);
      this.setSpanSuccess();
      return result;
    } catch (error) {
      this.setSpanError(error as Error);
      throw error;
    } finally {
      this.endSpan(span);
    }
  }

  /**
   * Check if tracing is enabled
   */
  public isTracingEnabled(): boolean {
    return this.isEnabled;
  }
}
