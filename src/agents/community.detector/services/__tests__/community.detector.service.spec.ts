import { vi, describe, it, expect, beforeEach, afterEach, MockedObject } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";
import { CommunityDetectorService } from "../community.detector.service";
import { Neo4jService } from "../../../../core/neo4j/services/neo4j.service";
import { AppLoggingService } from "../../../../core/logging/services/logging.service";
import { CommunityRepository } from "../../../../foundations/community/repositories/community.repository";

// NOTE: CommunitySummariserService import REMOVED - no longer a dependency

describe("CommunityDetectorService", () => {
  let service: CommunityDetectorService;
  let neo4jService: MockedObject<Neo4jService>;
  let logger: MockedObject<AppLoggingService>;
  let communityRepository: MockedObject<CommunityRepository>;

  const TEST_IDS = {
    companyId: "550e8400-e29b-41d4-a716-446655440000",
    communityId: "660e8400-e29b-41d4-a716-446655440001",
    keyConceptId: "770e8400-e29b-41d4-a716-446655440002",
    contentId: "880e8400-e29b-41d4-a716-446655440003",
  };

  const createMockNeo4jService = () => ({
    initQuery: vi.fn().mockReturnValue({ query: "", queryParams: {} }),
    read: vi.fn(),
    writeOne: vi.fn(),
    readOne: vi.fn(),
    readMany: vi.fn(),
  });

  const createMockLogger = () => ({
    log: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    verbose: vi.fn(),
    fatal: vi.fn(),
    trace: vi.fn(),
    logWithContext: vi.fn(),
    errorWithContext: vi.fn(),
    setRequestContext: vi.fn(),
    getRequestContext: vi.fn(),
    clearRequestContext: vi.fn(),
    createChildLogger: vi.fn(),
    logHttpRequest: vi.fn(),
    logHttpError: vi.fn(),
    logBusinessEvent: vi.fn(),
    logSecurityEvent: vi.fn(),
  });

  const createMockCommunityRepository = () => ({
    deleteAllCommunities: vi.fn(),
    createCommunity: vi.fn(),
    updateCommunityMembers: vi.fn(),
    setParentCommunity: vi.fn(),
    markAsStale: vi.fn(),
    findCommunitiesByKeyConcept: vi.fn(),
    findOrphanKeyConceptsForContent: vi.fn(),
    findCommunitiesByRelatedKeyConcepts: vi.fn(),
    addMemberToCommunity: vi.fn(),
    findById: vi.fn(),
    countByLevel: vi.fn(),
  });

  beforeEach(async () => {
    vi.clearAllMocks();
    const mockNeo4jService = createMockNeo4jService();
    const mockLogger = createMockLogger();
    const mockCommunityRepository = createMockCommunityRepository();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommunityDetectorService,
        { provide: Neo4jService, useValue: mockNeo4jService },
        { provide: AppLoggingService, useValue: mockLogger },
        { provide: CommunityRepository, useValue: mockCommunityRepository },
      ],
    }).compile();

    service = module.get<CommunityDetectorService>(CommunityDetectorService);
    neo4jService = module.get(Neo4jService) as MockedObject<Neo4jService>;
    logger = module.get(AppLoggingService) as MockedObject<AppLoggingService>;
    communityRepository = module.get(CommunityRepository) as MockedObject<CommunityRepository>;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("assignKeyConceptsToCommunities", () => {
    it("should assign orphan KeyConcepts to communities with highest affinity", async () => {
      const orphanIds = ["kc1", "kc2"];
      const relatedCommunities1 = [
        { communityId: TEST_IDS.communityId, totalWeight: 5.0, memberCount: 10, relationshipCount: 3 },
      ];
      const relatedCommunities2 = [{ communityId: "comm2", totalWeight: 3.0, memberCount: 8, relationshipCount: 2 }];

      communityRepository.findOrphanKeyConceptsForContent.mockResolvedValue(orphanIds);
      communityRepository.findCommunitiesByRelatedKeyConcepts
        .mockResolvedValueOnce(relatedCommunities1)
        .mockResolvedValueOnce(relatedCommunities2);
      communityRepository.addMemberToCommunity.mockResolvedValue(undefined);
      communityRepository.markAsStale.mockResolvedValue(undefined);

      await service.assignKeyConceptsToCommunities(TEST_IDS.contentId, "Content");

      expect(communityRepository.addMemberToCommunity).toHaveBeenCalledWith(TEST_IDS.communityId, "kc1");
      expect(communityRepository.addMemberToCommunity).toHaveBeenCalledWith("comm2", "kc2");
      expect(communityRepository.markAsStale).toHaveBeenCalledWith([TEST_IDS.communityId, "comm2"]);
    });

    it("should not assign KeyConcepts with no related communities", async () => {
      const orphanIds = ["kc1"];
      communityRepository.findOrphanKeyConceptsForContent.mockResolvedValue(orphanIds);
      communityRepository.findCommunitiesByRelatedKeyConcepts.mockResolvedValue([]);

      await service.assignKeyConceptsToCommunities(TEST_IDS.contentId, "Content");

      expect(communityRepository.addMemberToCommunity).not.toHaveBeenCalled();
      expect(communityRepository.markAsStale).not.toHaveBeenCalled();
    });

    it("should call markAsStale once with unique affected community IDs", async () => {
      const orphanIds = ["kc1", "kc2"];
      const relatedCommunities = [
        { communityId: TEST_IDS.communityId, totalWeight: 5.0, memberCount: 10, relationshipCount: 3 },
      ];

      communityRepository.findOrphanKeyConceptsForContent.mockResolvedValue(orphanIds);
      communityRepository.findCommunitiesByRelatedKeyConcepts.mockResolvedValue(relatedCommunities);
      communityRepository.addMemberToCommunity.mockResolvedValue(undefined);
      communityRepository.markAsStale.mockResolvedValue(undefined);

      await service.assignKeyConceptsToCommunities(TEST_IDS.contentId, "Content");

      expect(communityRepository.markAsStale).toHaveBeenCalledTimes(1);
      expect(communityRepository.markAsStale).toHaveBeenCalledWith([TEST_IDS.communityId]);
    });
  });

  describe("detectAndAssignCommunities", () => {
    it("should call detectCommunities() when countByLevel returns empty array (no communities)", async () => {
      communityRepository.countByLevel.mockResolvedValue([]);
      neo4jService.read.mockResolvedValue({ records: [] });

      await service.detectAndAssignCommunities(TEST_IDS.contentId, "Article");

      expect(communityRepository.deleteAllCommunities).toHaveBeenCalled();
      expect(communityRepository.findOrphanKeyConceptsForContent).not.toHaveBeenCalled();
    });

    it("should call assignKeyConceptsToCommunities() when communities exist", async () => {
      communityRepository.countByLevel.mockResolvedValue([{ level: 0, count: 5 }]);
      communityRepository.findOrphanKeyConceptsForContent.mockResolvedValue([]);

      await service.detectAndAssignCommunities(TEST_IDS.contentId, "Article");

      expect(communityRepository.findOrphanKeyConceptsForContent).toHaveBeenCalledWith(TEST_IDS.contentId, "Article");
      expect(communityRepository.deleteAllCommunities).not.toHaveBeenCalled();
    });
  });
});
