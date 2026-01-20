import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";
import { ModuleRepository } from "../module.repository";
import { Neo4jService } from "../../../../core/neo4j/services/neo4j.service";
import { AppLoggingService } from "../../../../core/logging/services/logging.service";

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

describe("ModuleRepository", () => {
  let repository: ModuleRepository;
  let neo4jService: ReturnType<typeof createMockNeo4jService>;
  let loggingService: ReturnType<typeof createMockLoggingService>;

  beforeEach(async () => {
    neo4jService = createMockNeo4jService();
    loggingService = createMockLoggingService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ModuleRepository,
        { provide: Neo4jService, useValue: neo4jService },
        { provide: AppLoggingService, useValue: loggingService },
      ],
    }).compile();

    repository = module.get<ModuleRepository>(ModuleRepository);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("onModuleInit", () => {
    it("should create unique constraint on id field", async () => {
      neo4jService.writeOne.mockResolvedValue(undefined);

      await repository.onModuleInit();

      expect(neo4jService.writeOne).toHaveBeenCalledWith({
        query: "CREATE CONSTRAINT module_id IF NOT EXISTS FOR (module:Module) REQUIRE module.id IS UNIQUE",
      });
    });

    it("should handle errors during constraint creation", async () => {
      const error = new Error("Constraint creation failed");
      neo4jService.writeOne.mockRejectedValue(error);

      await expect(repository.onModuleInit()).rejects.toThrow("Constraint creation failed");
    });

    it("should call writeOne exactly once", async () => {
      neo4jService.writeOne.mockResolvedValue(undefined);

      await repository.onModuleInit();

      expect(neo4jService.writeOne).toHaveBeenCalledTimes(1);
    });
  });
});
