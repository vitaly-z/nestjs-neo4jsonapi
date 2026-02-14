import { InjectQueue } from "@nestjs/bullmq";
import { Injectable } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { Queue } from "bullmq";
import { QueueId } from "../../../config";
import { AppLoggingService } from "../../../core/logging/services/logging.service";
import { CommunityRepository } from "../../../foundations/community/repositories/community.repository";

@Injectable()
export class CommunitySummariserCron {
  constructor(
    private readonly communityRepository: CommunityRepository,
    @InjectQueue(QueueId.COMMUNITY_SUMMARISER)
    private readonly summariserQueue: Queue,
    private readonly logger: AppLoggingService,
  ) {}

  @Cron(CronExpression.EVERY_10_MINUTES)
  async handleStaleCommunities(): Promise<void> {
    const staleCommunities = await this.communityRepository.findAllStaleCommunities();
    for (const { communityId, companyId } of staleCommunities) {
      try {
        await this.summariserQueue.add("process-stale", {
          communityId,
          companyId,
        });
      } catch (error) {
        this.logger.error(
          `Failed to enqueue stale community ${communityId} for company ${companyId}: ${(error as Error).message}`,
          "CommunitySummariserCron",
        );
      }
    }
  }
}
