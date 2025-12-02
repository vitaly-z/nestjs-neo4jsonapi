import { DynamicModule, Module } from "@nestjs/common";
import { VersionService } from "./services/version.service";

@Module({})
export class VersionModule {
  static forRoot(): DynamicModule {
    return {
      module: VersionModule,
      providers: [VersionService],
      exports: [VersionService],
      global: true,
    };
  }
}
