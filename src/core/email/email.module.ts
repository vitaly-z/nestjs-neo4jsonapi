import { Global, Module, DynamicModule } from "@nestjs/common";
import { EmailService } from "./services/email.service";

export interface EmailModuleOptions {
  // Currently no specific options, but can be extended
}

const EMAIL_SERVICES = [EmailService];

@Global()
@Module({
  providers: EMAIL_SERVICES,
  exports: EMAIL_SERVICES,
})
export class EmailModule {
  static forRoot(_options?: EmailModuleOptions): DynamicModule {
    return {
      module: EmailModule,
      providers: [EmailService],
      exports: [EmailService],
      global: true,
    };
  }

  static forRootAsync(options: {
    imports?: any[];
    useFactory: (...args: any[]) => Promise<EmailModuleOptions> | EmailModuleOptions;
    inject?: any[];
  }): DynamicModule {
    return {
      module: EmailModule,
      imports: options.imports || [],
      providers: [
        {
          provide: "EMAIL_OPTIONS",
          useFactory: options.useFactory,
          inject: options.inject || [],
        },
        EmailService,
      ],
      exports: [EmailService],
      global: true,
    };
  }
}
