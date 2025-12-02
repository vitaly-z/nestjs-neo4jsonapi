import { Global, Module, DynamicModule } from "@nestjs/common";
import { JsonApiService } from "./services/jsonapi.service";
import { JsonApiSerialiserFactory } from "./factories/jsonapi.serialiser.factory";
import { DynamicRelationshipFactory } from "./factories/dynamic.relationship.factory";

export interface JsonApiModuleOptions {
  // Currently no specific options, but can be extended
}

const JSONAPI_SERVICES = [JsonApiService, JsonApiSerialiserFactory, DynamicRelationshipFactory];

@Global()
@Module({
  providers: JSONAPI_SERVICES,
  exports: JSONAPI_SERVICES,
})
export class JsonApiModule {
  static forRoot(_options?: JsonApiModuleOptions): DynamicModule {
    return {
      module: JsonApiModule,
      providers: JSONAPI_SERVICES,
      exports: JSONAPI_SERVICES,
      global: true,
    };
  }

  static forRootAsync(options: {
    imports?: any[];
    useFactory: (...args: any[]) => Promise<JsonApiModuleOptions> | JsonApiModuleOptions;
    inject?: any[];
  }): DynamicModule {
    return {
      module: JsonApiModule,
      imports: options.imports || [],
      providers: [
        {
          provide: "JSON_API_OPTIONS",
          useFactory: options.useFactory,
          inject: options.inject || [],
        },
        ...JSONAPI_SERVICES,
      ],
      exports: JSONAPI_SERVICES,
      global: true,
    };
  }
}
