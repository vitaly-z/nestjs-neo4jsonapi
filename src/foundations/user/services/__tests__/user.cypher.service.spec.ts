import { vi, describe, it, expect, beforeEach, afterEach, MockedObject } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";
import { ClsService } from "nestjs-cls";
import { UserCypherService } from "../user.cypher.service";
import { CypherService } from "../../../../core/neo4j/services/cypher.service";

describe("UserCypherService", () => {
  let service: UserCypherService;
  let cypherService: MockedObject<CypherService>;
  let clsService: MockedObject<ClsService>;

  const createMockCypherService = () => ({
    buildQuery: vi.fn(),
  });

  const createMockClsService = () => ({
    get: vi.fn(),
    set: vi.fn(),
    run: vi.fn(),
  });

  beforeEach(async () => {
    vi.clearAllMocks();

    const mockCypherService = createMockCypherService();
    const mockClsService = createMockClsService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserCypherService,
        { provide: CypherService, useValue: mockCypherService },
        { provide: ClsService, useValue: mockClsService },
      ],
    }).compile();

    service = module.get<UserCypherService>(UserCypherService);
    cypherService = module.get(CypherService) as MockedObject<CypherService>;
    clsService = module.get(ClsService) as MockedObject<ClsService>;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("constructor", () => {
    it("should create the service", () => {
      expect(service).toBeDefined();
    });
  });

  describe("default", () => {
    it("should generate default cypher query without search field", () => {
      const result = service.default();

      expect(result).toContain("MATCH (user:User");
      expect(result).toContain("WHERE $companyId IS NULL");
      expect(result).toContain("OR EXISTS {");
      expect(result).toContain("MATCH (user)-[:BELONGS_TO]-(company)");
      // Should not contain search field condition when no params provided
      expect(result).not.toContain("$searchValue");
    });

    it("should generate cypher query with search field when provided", () => {
      const result = service.default({ searchField: "id" });

      expect(result).toContain("MATCH (user:User {id: $searchValue}");
      expect(result).toContain("WHERE $companyId IS NULL");
    });

    it("should generate cypher query with email search field", () => {
      const result = service.default({ searchField: "email" });

      expect(result).toContain("MATCH (user:User {email: $searchValue}");
    });

    it("should include company relationship check", () => {
      const result = service.default();

      expect(result).toContain("EXISTS {");
      expect(result).toContain("MATCH (user)-[:BELONGS_TO]-(company)");
    });
  });

  describe("userHasAccess", () => {
    it("should return an empty string", () => {
      const result = service.userHasAccess();

      expect(result).toBe("");
    });
  });

  describe("returnStatement", () => {
    it("should generate return statement with user node", () => {
      const result = service.returnStatement();

      expect(result).toContain("RETURN user");
    });

    it("should be trimmed and contain only RETURN user", () => {
      const result = service.returnStatement();

      expect(result.trim()).toContain("RETURN user");
    });
  });

  describe("integration scenarios", () => {
    it("should build complete query with default and return statement", () => {
      const defaultQuery = service.default({ searchField: "id" });
      const returnStatement = service.returnStatement();

      const fullQuery = defaultQuery + returnStatement;

      expect(fullQuery).toContain("MATCH (user:User {id: $searchValue}");
      expect(fullQuery).toContain("WHERE $companyId IS NULL");
      expect(fullQuery).toContain("RETURN user");
    });

    it("should build complete query without search field", () => {
      const defaultQuery = service.default();
      const returnStatement = service.returnStatement();

      const fullQuery = defaultQuery + returnStatement;

      expect(fullQuery).toContain("MATCH (user:User");
      expect(fullQuery).not.toContain("{id: $searchValue}");
      expect(fullQuery).toContain("RETURN user");
    });
  });
});
