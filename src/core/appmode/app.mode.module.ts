import { DynamicModule, Global, Module } from "@nestjs/common";
import { APP_MODE_TOKEN, AppMode, AppModeConfig } from "./constants/app.mode.constant";

const defaultModeConfig: AppModeConfig = {
  mode: AppMode.API,
  enableControllers: true,
  enableWorkers: false,
  enableCronJobs: false,
};

@Global()
@Module({
  providers: [
    {
      provide: APP_MODE_TOKEN,
      useValue: defaultModeConfig,
    },
  ],
  exports: [APP_MODE_TOKEN],
})
export class AppModeModule {
  static forRoot(modeConfig: AppModeConfig): DynamicModule {
    return {
      module: AppModeModule,
      providers: [
        {
          provide: APP_MODE_TOKEN,
          useValue: modeConfig,
        },
      ],
      exports: [APP_MODE_TOKEN],
      global: true,
    };
  }
}
