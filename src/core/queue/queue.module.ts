import { BullModule } from "@nestjs/bullmq";
import { Global, Module } from "@nestjs/common";
import { baseConfig } from "../../config/base.config";
import { QueueId } from "../../config/enums/queue.id";

/**
 * Get queue registrations for BullMQ.
 * Library's CHUNK queue is ALWAYS registered (from library's QueueId.CHUNK).
 * App's additional queues come from baseConfig.chunkQueues.queueIds.
 */
function getQueueRegistrations() {
  const allQueueIds = new Set([
    QueueId.CHUNK, // Library always needs this
    ...(baseConfig.chunkQueues?.queueIds ?? []),
  ]);
  return Array.from(allQueueIds).map((name) => BullModule.registerQueue({ name }));
}

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
    ...getQueueRegistrations(),
  ],
  exports: [BullModule],
})
export class QueueModule {}
