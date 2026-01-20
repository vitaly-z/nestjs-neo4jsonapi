import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";
import { NotificationRepository } from "../notification.repository";
import { Neo4jService } from "../../../../core/neo4j/services/neo4j.service";
import { Notification } from "../../entities/notification.entity";

// Test IDs
const TEST_IDS = {
  companyId: "550e8400-e29b-41d4-a716-446655440000",
  userId: "660e8400-e29b-41d4-a716-446655440001",
  actorId: "770e8400-e29b-41d4-a716-446655440002",
  notificationId1: "880e8400-e29b-41d4-a716-446655440003",
  notificationId2: "990e8400-e29b-41d4-a716-446655440004",
};

// Mock factories
const createMockNeo4jService = () => ({
  writeOne: vi.fn(),
  readOne: vi.fn(),
  readMany: vi.fn(),
  initQuery: vi.fn(),
  validateExistingNodes: vi.fn(),
});

describe("NotificationRepository", () => {
  let repository: NotificationRepository;
  let neo4jService: ReturnType<typeof createMockNeo4jService>;

  const createMockQuery = () => ({
    query: "",
    queryParams: {},
  });

  const MOCK_NOTIFICATION: Notification = {
    id: TEST_IDS.notificationId1,
    notificationType: "MENTION",
    isRead: false,
    isArchived: false,
    createdAt: new Date("2025-01-01T00:00:00Z"),
    updatedAt: new Date("2025-01-01T00:00:00Z"),
  } as Notification;

  beforeEach(async () => {
    neo4jService = createMockNeo4jService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [NotificationRepository, { provide: Neo4jService, useValue: neo4jService }],
    }).compile();

    repository = module.get<NotificationRepository>(NotificationRepository);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("onModuleInit", () => {
    it("should create unique constraint on id field", async () => {
      neo4jService.writeOne.mockResolvedValue(undefined);

      await repository.onModuleInit();

      expect(neo4jService.writeOne).toHaveBeenCalledWith({
        query:
          "CREATE CONSTRAINT notification_id IF NOT EXISTS FOR (notification:Notification) REQUIRE notification.id IS UNIQUE",
      });
    });

    it("should handle errors", async () => {
      neo4jService.writeOne.mockRejectedValue(new Error("Constraint creation failed"));

      await expect(repository.onModuleInit()).rejects.toThrow("Constraint creation failed");
    });
  });

  describe("find", () => {
    it("should find notifications for a user", async () => {
      const mockQuery = createMockQuery();
      neo4jService.initQuery.mockReturnValue(mockQuery);
      neo4jService.readMany.mockResolvedValue([MOCK_NOTIFICATION]);

      const result = await repository.find({ userId: TEST_IDS.userId });

      expect(mockQuery.queryParams.userId).toBe(TEST_IDS.userId);
      expect(mockQuery.query).toContain(":TRIGGERED_FOR");
      expect(mockQuery.query).toContain("ORDER BY notification.createdAt DESC");
      expect(result).toEqual([MOCK_NOTIFICATION]);
    });

    it("should filter archived notifications when isArchived is true", async () => {
      const mockQuery = createMockQuery();
      neo4jService.initQuery.mockReturnValue(mockQuery);
      neo4jService.readMany.mockResolvedValue([]);

      await repository.find({ userId: TEST_IDS.userId, isArchived: true });

      expect(mockQuery.query).toContain("notification.isArchived = true");
    });

    it("should filter non-archived notifications when isArchived is false/undefined", async () => {
      const mockQuery = createMockQuery();
      neo4jService.initQuery.mockReturnValue(mockQuery);
      neo4jService.readMany.mockResolvedValue([MOCK_NOTIFICATION]);

      await repository.find({ userId: TEST_IDS.userId });

      expect(mockQuery.query).toContain("notification.isArchived IS null");
    });

    it("should pass cursor to initQuery", async () => {
      const mockQuery = createMockQuery();
      neo4jService.initQuery.mockReturnValue(mockQuery);
      neo4jService.readMany.mockResolvedValue([]);

      const cursor = { limit: 10, offset: 0 };
      await repository.find({ userId: TEST_IDS.userId, cursor });

      expect(neo4jService.initQuery).toHaveBeenCalledWith(expect.objectContaining({ cursor }));
    });
  });

  describe("findById", () => {
    it("should find notification by ID", async () => {
      const mockQuery = createMockQuery();
      neo4jService.initQuery.mockReturnValue(mockQuery);
      neo4jService.readOne.mockResolvedValue(MOCK_NOTIFICATION);

      const result = await repository.findById({
        notificationId: TEST_IDS.notificationId1,
        userId: TEST_IDS.userId,
      });

      expect(mockQuery.queryParams.notificationId).toBe(TEST_IDS.notificationId1);
      expect(mockQuery.queryParams.userId).toBe(TEST_IDS.userId);
      expect(mockQuery.query).toContain("id: $notificationId");
      expect(result).toEqual(MOCK_NOTIFICATION);
    });

    it("should return null when notification not found", async () => {
      const mockQuery = createMockQuery();
      neo4jService.initQuery.mockReturnValue(mockQuery);
      neo4jService.readOne.mockResolvedValue(null);

      const result = await repository.findById({
        notificationId: "nonexistent",
        userId: TEST_IDS.userId,
      });

      expect(result).toBeNull();
    });
  });

  describe("markAsRead", () => {
    it("should mark notifications as read", async () => {
      const mockQuery = createMockQuery();
      neo4jService.initQuery.mockReturnValue(mockQuery);
      neo4jService.writeOne.mockResolvedValue(undefined);

      const notificationIds = [TEST_IDS.notificationId1, TEST_IDS.notificationId2];
      await repository.markAsRead({ userId: TEST_IDS.userId, notificationIds });

      expect(mockQuery.queryParams.userId).toBe(TEST_IDS.userId);
      expect(mockQuery.queryParams.notificationIds).toEqual(notificationIds);
      expect(mockQuery.query).toContain("notification.id IN $notificationIds");
      expect(mockQuery.query).toContain("SET notification.isRead = true");
      expect(neo4jService.writeOne).toHaveBeenCalledWith(mockQuery);
    });
  });

  describe("archive", () => {
    it("should archive notification", async () => {
      const mockQuery = createMockQuery();
      neo4jService.initQuery.mockReturnValue(mockQuery);
      neo4jService.writeOne.mockResolvedValue(undefined);

      await repository.archive({ notificationId: TEST_IDS.notificationId1 });

      expect(mockQuery.queryParams.notificationId).toBe(TEST_IDS.notificationId1);
      expect(mockQuery.query).toContain("SET notification.isArchived = true");
      expect(mockQuery.query).toContain("notification.updatedAt = datetime()");
      expect(neo4jService.writeOne).toHaveBeenCalledWith(mockQuery);
    });
  });

  describe("create", () => {
    it("should create notification with actor", async () => {
      const mockQuery = createMockQuery();
      neo4jService.initQuery.mockReturnValue(mockQuery);
      neo4jService.validateExistingNodes.mockResolvedValue(undefined);
      neo4jService.writeOne.mockResolvedValue(undefined);
      neo4jService.readOne.mockResolvedValue(MOCK_NOTIFICATION);

      const result = await repository.create({
        notificationType: "MENTION",
        userId: TEST_IDS.userId,
        actorId: TEST_IDS.actorId,
      });

      expect(neo4jService.validateExistingNodes).toHaveBeenCalled();
      expect(mockQuery.queryParams.notificationType).toBe("MENTION");
      expect(mockQuery.query).toContain("CREATE (notification:Notification");
      expect(neo4jService.writeOne).toHaveBeenCalledWith(mockQuery);
      expect(result).toEqual(MOCK_NOTIFICATION);
    });

    it("should create notification without actor", async () => {
      const mockQuery = createMockQuery();
      neo4jService.initQuery.mockReturnValue(mockQuery);
      neo4jService.validateExistingNodes.mockResolvedValue(undefined);
      neo4jService.writeOne.mockResolvedValue(undefined);
      neo4jService.readOne.mockResolvedValue(MOCK_NOTIFICATION);

      await repository.create({
        notificationType: "SYSTEM",
        userId: TEST_IDS.userId,
      });

      expect(mockQuery.queryParams.notificationType).toBe("SYSTEM");
      expect(neo4jService.writeOne).toHaveBeenCalled();
    });

    it("should generate UUID for new notification", async () => {
      const mockQuery = createMockQuery();
      neo4jService.initQuery.mockReturnValue(mockQuery);
      neo4jService.validateExistingNodes.mockResolvedValue(undefined);
      neo4jService.writeOne.mockResolvedValue(undefined);
      neo4jService.readOne.mockResolvedValue(MOCK_NOTIFICATION);

      await repository.create({
        notificationType: "MENTION",
        userId: TEST_IDS.userId,
      });

      expect(mockQuery.queryParams.notificationId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
      );
    });
  });

  describe("Edge Cases", () => {
    it("should preserve exact UUID values", async () => {
      const mockQuery = createMockQuery();
      neo4jService.initQuery.mockReturnValue(mockQuery);
      neo4jService.readOne.mockResolvedValue(null);

      const exactId = "123e4567-e89b-12d3-a456-426614174000";
      await repository.findById({ notificationId: exactId, userId: TEST_IDS.userId });

      expect(mockQuery.queryParams.notificationId).toBe(exactId);
    });

    it("should handle empty notification IDs array in markAsRead", async () => {
      const mockQuery = createMockQuery();
      neo4jService.initQuery.mockReturnValue(mockQuery);
      neo4jService.writeOne.mockResolvedValue(undefined);

      await repository.markAsRead({ userId: TEST_IDS.userId, notificationIds: [] });

      expect(mockQuery.queryParams.notificationIds).toEqual([]);
    });
  });
});
