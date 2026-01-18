import { InjectQueue } from "@nestjs/bullmq";
import { Injectable } from "@nestjs/common";
import { Queue } from "bullmq";
import { QueueId } from "../../../config/enums/queue.id";
import { AppLoggingService } from "../../../core/logging/services/logging.service";

@Injectable()
export class TrialQueueService {
  constructor(
    @InjectQueue(QueueId.TRIAL) private readonly trialQueue: Queue,
    private readonly logger: AppLoggingService,
  ) {}

  async queueTrialCreation(params: { companyId: string; userId: string }): Promise<void> {
    try {
      await this.trialQueue.add(
        "process_trial",
        {
          companyId: params.companyId,
          userId: params.userId,
        },
        {
          attempts: 3,
          backoff: {
            type: "exponential",
            delay: 5000,
          },
          removeOnComplete: true,
          removeOnFail: false,
        },
      );
      this.logger.log(`Trial creation queued for company ${params.companyId}`);
    } catch (error) {
      // Log but don't block - trial setup is non-critical for registration
      this.logger.error(`Failed to queue trial creation for company ${params.companyId}: ${error}`);
    }
  }
}
