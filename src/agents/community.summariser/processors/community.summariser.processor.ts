import { OnWorkerEvent, Processor, WorkerHost } from "@nestjs/bullmq";
import { Job } from "bullmq";
import { ClsService } from "nestjs-cls";
import { QueueId } from "../../../config";
import { AppLoggingService } from "../../../core/logging/services/logging.service";
import { CommunitySummariserService } from "../services/community.summariser.service";

interface CommunitySummariserJobData {
  communityId: string;
  companyId: string;
}

@Processor(QueueId.COMMUNITY_SUMMARISER, { concurrency: 1, lockDuration: 1000 * 60 * 5 })
export class CommunitySummariserProcessor extends WorkerHost {
  constructor(
    private readonly summariserService: CommunitySummariserService,
    private readonly cls: ClsService,
    private readonly logger: AppLoggingService,
  ) {
    super();
  }

  @OnWorkerEvent("active")
  onActive(job: Job) {
    this.logger.debug(`Processing community summariser job ${job.name} (ID: ${job.id})`);
  }

  @OnWorkerEvent("failed")
  onError(job: Job) {
    this.logger.error(
      `Error processing community summariser job ${job.name} (ID: ${job.id}). Reason: ${job.failedReason}`,
    );
  }

  @OnWorkerEvent("completed")
  onCompleted(job: Job) {
    this.logger.debug(`Completed community summariser job ${job.name} (ID: ${job.id})`);
  }

  async process(job: Job<CommunitySummariserJobData>): Promise<void> {
    const { communityId, companyId } = job.data;

    await this.cls.run(async () => {
      this.cls.set("companyId", companyId);

      this.logger.log(
        `Starting community summarisation for community ${communityId} (company ${companyId})`,
        "CommunitySummariserProcessor",
      );

      await this.summariserService.generateSummaryById(communityId);

      this.logger.log(`Completed community summarisation for community ${communityId}`, "CommunitySummariserProcessor");
    });
  }
}
