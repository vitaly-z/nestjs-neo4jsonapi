import { BullModule } from "@nestjs/bullmq";
import { Global, Module } from "@nestjs/common";
import { baseConfig } from "../../config/base.config";

@Global()
@Module({
  imports: [
    BullModule.forRoot({
      connection: {
        host: baseConfig.redis?.host,
        port: baseConfig.redis?.port,
        password: baseConfig.redis?.password,
        username: baseConfig.redis?.username,
      },
    }),
  ],
  exports: [BullModule],
})
export class QueueModule {}
