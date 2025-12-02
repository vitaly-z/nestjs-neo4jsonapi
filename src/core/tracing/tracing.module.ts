import { Global, Module, DynamicModule } from "@nestjs/common";
import { TracingInterceptor } from "./interceptors/tracing.interceptor";
import { TracingService } from "./services/tracing.service";

export interface TracingModuleOptions {
  // Currently no specific options, but can be extended
}

@Global()
@Module({})
export class TracingModule {
  static forRoot(_options?: TracingModuleOptions): DynamicModule {
    return {
      module: TracingModule,
      providers: [TracingService, TracingInterceptor],
      exports: [TracingService, TracingInterceptor],
      global: true,
    };
  }

  static forRootAsync(options: {
    imports?: any[];
    useFactory: (...args: any[]) => Promise<TracingModuleOptions> | TracingModuleOptions;
    inject?: any[];
  }): DynamicModule {
    return {
      module: TracingModule,
      imports: options.imports || [],
      providers: [
        {
          provide: "TRACING_OPTIONS",
          useFactory: options.useFactory,
          inject: options.inject || [],
        },
        TracingService,
        TracingInterceptor,
      ],
      exports: [TracingService, TracingInterceptor],
      global: true,
    };
  }
}
