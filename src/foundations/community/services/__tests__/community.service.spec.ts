import { vi, describe, it, expect, beforeEach, afterEach, MockedObject } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";
import { CommunityService } from "../community.service";
import { CommunityRepository } from "../../repositories/community.repository";
import { JsonApiService } from "../../../../core/jsonapi/services/jsonapi.service";

describe("CommunityService", () => {
  let service: CommunityService;
  let communityRepository: MockedObject<CommunityRepository>;
  let jsonApiService: MockedObject<JsonApiService>;

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
    findAllStaleCommunities: vi.fn(),
  });

  const createMockJsonApiService = () => ({
    buildSingle: vi.fn(),
    buildList: vi.fn(),
    buildError: vi.fn(),
  });

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommunityService,
        { provide: CommunityRepository, useValue: createMockCommunityRepository() },
        { provide: JsonApiService, useValue: createMockJsonApiService() },
      ],
    }).compile();

    service = module.get<CommunityService>(CommunityService);
    communityRepository = module.get(CommunityRepository) as MockedObject<CommunityRepository>;
    jsonApiService = module.get(JsonApiService) as MockedObject<JsonApiService>;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("constructor", () => {
    it("should create the service", () => {
      expect(service).toBeDefined();
    });

    it("should inject CommunityRepository", () => {
      expect(communityRepository).toBeDefined();
    });

    it("should inject JsonApiService", () => {
      expect(jsonApiService).toBeDefined();
    });
  });
});
