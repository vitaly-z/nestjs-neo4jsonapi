import { Global, Module } from "@nestjs/common";
import { LoggingInterceptor } from "./interceptors/logging.interceptor";
import { AppLoggingService } from "./services/logging.service";

@Global()
@Module({
  providers: [AppLoggingService, LoggingInterceptor],
  exports: [AppLoggingService, LoggingInterceptor],
})
export class LoggingModule {}
