import { Global, Module, DynamicModule } from "@nestjs/common";
import { CorsService } from "./services/cors.service";

export interface CorsModuleOptions {
  // Currently no specific options, but can be extended
}

const CORS_SERVICES = [CorsService];

@Global()
@Module({
  providers: CORS_SERVICES,
  exports: CORS_SERVICES,
})
export class CorsModule {
  static forRoot(_options?: CorsModuleOptions): DynamicModule {
    return {
      module: CorsModule,
      providers: [CorsService],
      exports: [CorsService],
      global: true,
    };
  }

  static forRootAsync(options: {
    imports?: any[];
    useFactory: (...args: any[]) => Promise<CorsModuleOptions> | CorsModuleOptions;
    inject?: any[];
  }): DynamicModule {
    return {
      module: CorsModule,
      imports: options.imports || [],
      providers: [
        {
          provide: "CORS_OPTIONS",
          useFactory: options.useFactory,
          inject: options.inject || [],
        },
        CorsService,
      ],
      exports: [CorsService],
      global: true,
    };
  }
}
