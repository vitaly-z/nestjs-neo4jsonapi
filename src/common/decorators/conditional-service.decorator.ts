import { Provider } from "@nestjs/common";
import "reflect-metadata";

/**
 * App mode enumeration for conditional providers
 */
export enum AppMode {
  API = "api",
  WORKER = "worker",
}

/**
 * App mode configuration interface
 */
export interface AppModeConfig {
  mode: AppMode;
  enableCronJobs: boolean;
  enableWorkers: boolean;
}

/**
 * Injection token for app mode
 */
export const APP_MODE_TOKEN = Symbol("APP_MODE_TOKEN");

/**
 * Helper function to create conditional providers based on app mode
 */
export function createConditionalProvider<T>(ServiceClass: new (...args: any[]) => T, modes: AppMode[]): Provider {
  // Get the constructor parameter types using reflection
  const paramTypes = Reflect.getMetadata("design:paramtypes", ServiceClass) || [];

  return {
    provide: ServiceClass,
    useFactory: (appMode: AppModeConfig, ...args: any[]) => {
      if (!modes.includes(appMode.mode)) return null;

      return new ServiceClass(...args);
    },
    inject: [APP_MODE_TOKEN, ...paramTypes],
  };
}

/**
 * Helper function to create providers that only run in worker mode
 */
export function createWorkerProvider<T>(ServiceClass: new (...args: any[]) => T): Provider {
  return createConditionalProvider(ServiceClass, [AppMode.WORKER]);
}

/**
 * Helper function to create providers that only run in API mode
 */
export function createApiProvider<T>(ServiceClass: new (...args: any[]) => T): Provider {
  return createConditionalProvider(ServiceClass, [AppMode.API]);
}

/**
 * Helper function to create providers that run in both modes but are mode-aware
 */
export function createModeAwareProvider<T>(ServiceClass: new (...args: any[]) => T): Provider {
  // Get the constructor parameter types using reflection
  const paramTypes = Reflect.getMetadata("design:paramtypes", ServiceClass) || [];

  return {
    provide: ServiceClass,
    useFactory: (appMode: AppModeConfig, ...args: any[]) => {
      const instance = new ServiceClass(...args);

      if (typeof (instance as any).setAppMode === "function") (instance as any).setAppMode(appMode);

      return instance;
    },
    inject: [APP_MODE_TOKEN, ...paramTypes],
  };
}

/**
 * Base class for services that need to be mode-aware
 */
export abstract class ModeAwareService {
  protected appMode?: AppModeConfig;

  setAppMode(appMode: AppModeConfig) {
    this.appMode = appMode;
  }

  protected isApiMode(): boolean {
    return this.appMode?.mode === AppMode.API;
  }

  protected isWorkerMode(): boolean {
    return this.appMode?.mode === AppMode.WORKER;
  }

  protected shouldRunCronJobs(): boolean {
    return this.appMode?.enableCronJobs === true;
  }

  protected shouldProcessJobs(): boolean {
    return this.appMode?.enableWorkers === true;
  }
}
