import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";
import { FeatureRepository } from "../feature.repository";
import { Neo4jService } from "../../../../core/neo4j/services/neo4j.service";
import { AppLoggingService } from "../../../../core/logging/services/logging.service";
import { Feature } from "../../entities/feature.entity";
import { FeatureModel } from "../../entities/feature.model";

// Test IDs
const TEST_IDS = {
  companyId: "550e8400-e29b-41d4-a716-446655440000",
  featureId1: "660e8400-e29b-41d4-a716-446655440001",
  featureId2: "770e8400-e29b-41d4-a716-446655440002",
};

// Mock factories
const createMockNeo4jService = () => ({
  writeOne: vi.fn(),
  readOne: vi.fn(),
  readMany: vi.fn(),
  initQuery: vi.fn(),
});

const createMockLoggingService = () => ({
  log: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  debug: vi.fn(),
});

describe("FeatureRepository", () => {
  let repository: FeatureRepository;
  let neo4jService: ReturnType<typeof createMockNeo4jService>;
  let loggingService: ReturnType<typeof createMockLoggingService>;

  const createMockQuery = () => ({
    query: "",
    queryParams: {},
  });

  const MOCK_FEATURE: Feature = {
    id: TEST_IDS.featureId1,
    name: "Test Feature",
    isCore: true,
    module: [],
    createdAt: new Date("2025-01-01T00:00:00Z"),
    updatedAt: new Date("2025-01-01T00:00:00Z"),
  } as Feature;

  const MOCK_FEATURE_2: Feature = {
    id: TEST_IDS.featureId2,
    name: "Another Feature",
    isCore: false,
    module: [],
    createdAt: new Date("2025-01-01T00:00:00Z"),
    updatedAt: new Date("2025-01-01T00:00:00Z"),
  } as Feature;

  beforeEach(async () => {
    neo4jService = createMockNeo4jService();
    loggingService = createMockLoggingService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeatureRepository,
        { provide: Neo4jService, useValue: neo4jService },
        { provide: AppLoggingService, useValue: loggingService },
      ],
    }).compile();

    repository = module.get<FeatureRepository>(FeatureRepository);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("onModuleInit", () => {
    it("should create unique constraint on id field", async () => {
      neo4jService.writeOne.mockResolvedValue(undefined);

      await repository.onModuleInit();

      expect(neo4jService.writeOne).toHaveBeenCalledWith({
        query: "CREATE CONSTRAINT feature_id IF NOT EXISTS FOR (feature:Feature) REQUIRE feature.id IS UNIQUE",
      });
    });

    it("should handle errors during constraint creation", async () => {
      const error = new Error("Constraint creation failed");
      neo4jService.writeOne.mockRejectedValue(error);

      await expect(repository.onModuleInit()).rejects.toThrow("Constraint creation failed");
    });
  });

  describe("findByCompany", () => {
    it("should find features by company ID", async () => {
      const mockQuery = createMockQuery();
      neo4jService.initQuery.mockReturnValue(mockQuery);
      neo4jService.readMany.mockResolvedValue([MOCK_FEATURE, MOCK_FEATURE_2]);

      const result = await repository.findByCompany({ companyId: TEST_IDS.companyId });

      expect(neo4jService.initQuery).toHaveBeenCalledWith({ serialiser: FeatureModel });
      expect(mockQuery.queryParams.companyId).toBe(TEST_IDS.companyId);
      expect(mockQuery.query).toContain("Company {id: $companyId}");
      expect(mockQuery.query).toContain(":HAS_FEATURE");
      expect(neo4jService.readMany).toHaveBeenCalledWith(mockQuery);
      expect(result).toEqual([MOCK_FEATURE, MOCK_FEATURE_2]);
    });

    it("should return empty array when company has no features", async () => {
      const mockQuery = createMockQuery();
      neo4jService.initQuery.mockReturnValue(mockQuery);
      neo4jService.readMany.mockResolvedValue([]);

      const result = await repository.findByCompany({ companyId: "nonexistent-company" });

      expect(result).toEqual([]);
    });

    it("should handle errors from neo4jService", async () => {
      const mockQuery = createMockQuery();
      neo4jService.initQuery.mockReturnValue(mockQuery);
      neo4jService.readMany.mockRejectedValue(new Error("Database error"));

      await expect(repository.findByCompany({ companyId: TEST_IDS.companyId })).rejects.toThrow("Database error");
    });
  });

  describe("find", () => {
    it("should find all features without search term", async () => {
      const mockQuery = createMockQuery();
      neo4jService.initQuery.mockReturnValue(mockQuery);
      neo4jService.readMany.mockResolvedValue([MOCK_FEATURE, MOCK_FEATURE_2]);

      const cursor = { limit: 10, offset: 0 };
      const result = await repository.find({ cursor });

      expect(neo4jService.initQuery).toHaveBeenCalledWith({
        serialiser: FeatureModel,
        cursor,
      });
      expect(mockQuery.queryParams.term).toBeUndefined();
      expect(mockQuery.query).toContain("MATCH (feature:Feature)");
      expect(mockQuery.query).toContain("ORDER BY feature.name ASC");
      expect(mockQuery.query).toContain("OPTIONAL MATCH (feature)<-[:IN_FEATURE]-(feature_module:Module)");
      expect(mockQuery.query).toContain("RETURN feature, feature_module");
      expect(result).toEqual([MOCK_FEATURE, MOCK_FEATURE_2]);
    });

    it("should find features with search term", async () => {
      const mockQuery = createMockQuery();
      neo4jService.initQuery.mockReturnValue(mockQuery);
      neo4jService.readMany.mockResolvedValue([MOCK_FEATURE]);

      const cursor = { limit: 10, offset: 0 };
      const result = await repository.find({ term: "Test", cursor });

      expect(mockQuery.queryParams.term).toBe("Test");
      expect(mockQuery.query).toContain("WHERE toLower(feature.name) CONTAINS toLower($term)");
      expect(result).toEqual([MOCK_FEATURE]);
    });

    it("should not include WHERE clause when term is empty", async () => {
      const mockQuery = createMockQuery();
      neo4jService.initQuery.mockReturnValue(mockQuery);
      neo4jService.readMany.mockResolvedValue([]);

      const cursor = { limit: 10, offset: 0 };
      await repository.find({ term: "", cursor });

      // Empty string is falsy, so WHERE clause should not be added
      expect(mockQuery.query).not.toContain("WHERE toLower");
    });

    it("should pass cursor to initQuery", async () => {
      const mockQuery = createMockQuery();
      neo4jService.initQuery.mockReturnValue(mockQuery);
      neo4jService.readMany.mockResolvedValue([]);

      const cursor = { limit: 25, offset: 50 };
      await repository.find({ cursor });

      expect(neo4jService.initQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          cursor,
        }),
      );
    });

    it("should return empty array when no features found", async () => {
      const mockQuery = createMockQuery();
      neo4jService.initQuery.mockReturnValue(mockQuery);
      neo4jService.readMany.mockResolvedValue([]);

      const cursor = { limit: 10, offset: 0 };
      const result = await repository.find({ term: "nonexistent", cursor });

      expect(result).toEqual([]);
    });

    it("should handle errors from neo4jService", async () => {
      const mockQuery = createMockQuery();
      neo4jService.initQuery.mockReturnValue(mockQuery);
      neo4jService.readMany.mockRejectedValue(new Error("Query failed"));

      const cursor = { limit: 10, offset: 0 };
      await expect(repository.find({ cursor })).rejects.toThrow("Query failed");
    });
  });

  describe("Edge Cases", () => {
    it("should preserve exact UUID values for companyId", async () => {
      const mockQuery = createMockQuery();
      neo4jService.initQuery.mockReturnValue(mockQuery);
      neo4jService.readMany.mockResolvedValue([]);

      const exactId = "123e4567-e89b-12d3-a456-426614174000";
      await repository.findByCompany({ companyId: exactId });

      expect(mockQuery.queryParams.companyId).toBe(exactId);
    });

    it("should handle special characters in search term", async () => {
      const mockQuery = createMockQuery();
      neo4jService.initQuery.mockReturnValue(mockQuery);
      neo4jService.readMany.mockResolvedValue([]);

      const specialTerm = "Test with 'quotes' and \"double quotes\"";
      const cursor = { limit: 10, offset: 0 };
      await repository.find({ term: specialTerm, cursor });

      expect(mockQuery.queryParams.term).toBe(specialTerm);
    });

    it("should include module relationship in return statement", async () => {
      const mockQuery = createMockQuery();
      neo4jService.initQuery.mockReturnValue(mockQuery);
      neo4jService.readMany.mockResolvedValue([MOCK_FEATURE]);

      const cursor = { limit: 10, offset: 0 };
      await repository.find({ cursor });

      expect(mockQuery.query).toContain("feature_module:Module");
      expect(mockQuery.query).toContain(":IN_FEATURE");
    });
  });
});
