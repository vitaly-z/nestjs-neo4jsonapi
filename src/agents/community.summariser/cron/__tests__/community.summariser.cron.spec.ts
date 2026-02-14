import { vi, describe, it, expect, beforeEach, MockedObject } from "vitest";
import { CommunitySummariserCron } from "../community.summariser.cron";
import { CommunityRepository } from "../../../../foundations/community/repositories/community.repository";
import { AppLoggingService } from "../../../../core/logging/services/logging.service";
import { Queue } from "bullmq";

describe("CommunitySummariserCron", () => {
  let cron: CommunitySummariserCron;
  let communityRepository: MockedObject<CommunityRepository>;
  let summariserQueue: MockedObject<Queue>;
  let logger: MockedObject<AppLoggingService>;

  const MOCK_STALE_COMMUNITIES = [
    { communityId: "comm-1", companyId: "company-1" },
    { communityId: "comm-2", companyId: "company-1" },
    { communityId: "comm-3", companyId: "company-2" },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    communityRepository = {
      findAllStaleCommunities: vi.fn(),
    } as unknown as MockedObject<CommunityRepository>;
    summariserQueue = { add: vi.fn() } as unknown as MockedObject<Queue>;
    logger = {
      log: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
    } as unknown as MockedObject<AppLoggingService>;
    cron = new CommunitySummariserCron(communityRepository, summariserQueue, logger);
  });

  describe("handleStaleCommunities", () => {
    it("should enqueue one job per stale community", async () => {
      communityRepository.findAllStaleCommunities.mockResolvedValue(MOCK_STALE_COMMUNITIES);
      summariserQueue.add.mockResolvedValue({} as any);
      await cron.handleStaleCommunities();
      expect(communityRepository.findAllStaleCommunities).toHaveBeenCalled();
      expect(summariserQueue.add).toHaveBeenCalledTimes(3);
      expect(summariserQueue.add).toHaveBeenCalledWith("process-stale", {
        communityId: "comm-1",
        companyId: "company-1",
      });
      expect(summariserQueue.add).toHaveBeenCalledWith("process-stale", {
        communityId: "comm-2",
        companyId: "company-1",
      });
      expect(summariserQueue.add).toHaveBeenCalledWith("process-stale", {
        communityId: "comm-3",
        companyId: "company-2",
      });
    });

    it("should handle empty stale communities list", async () => {
      communityRepository.findAllStaleCommunities.mockResolvedValue([]);
      await cron.handleStaleCommunities();
      expect(summariserQueue.add).not.toHaveBeenCalled();
    });

    it("should continue enqueuing jobs when one fails", async () => {
      communityRepository.findAllStaleCommunities.mockResolvedValue(MOCK_STALE_COMMUNITIES);
      summariserQueue.add
        .mockRejectedValueOnce(new Error("Queue connection lost"))
        .mockResolvedValueOnce({} as any)
        .mockResolvedValueOnce({} as any);
      await cron.handleStaleCommunities();
      expect(summariserQueue.add).toHaveBeenCalledTimes(3);
      expect(logger.error).toHaveBeenCalledWith(
        "Failed to enqueue stale community comm-1 for company company-1: Queue connection lost",
        "CommunitySummariserCron",
      );
    });
  });
});
