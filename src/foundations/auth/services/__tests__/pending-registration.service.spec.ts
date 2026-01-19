import { vi, describe, it, expect, beforeEach, afterEach, MockedObject } from "vitest";

// Create mock Redis instance that we can reference
const mockRedisInstance = {
  setex: vi.fn(),
  get: vi.fn(),
  del: vi.fn(),
  quit: vi.fn(),
  disconnect: vi.fn(),
};

// Mock ioredis before imports - use a class that can be instantiated with new
vi.mock("ioredis", () => {
  class MockRedis {
    setex = mockRedisInstance.setex;
    get = mockRedisInstance.get;
    del = mockRedisInstance.del;
    quit = mockRedisInstance.quit;
    disconnect = mockRedisInstance.disconnect;
  }
  return {
    Redis: MockRedis,
    default: MockRedis,
  };
});

// Mock crypto
vi.mock("crypto", async () => {
  const actual = await vi.importActual("crypto");
  return {
    ...actual,
    randomUUID: () => "mock-random-uuid",
  };
});

import { Test, TestingModule } from "@nestjs/testing";
import { ConfigService } from "@nestjs/config";
import { PendingRegistrationService, PendingRegistration } from "../pending-registration.service";

describe("PendingRegistrationService", () => {
  let service: PendingRegistrationService;
  let configService: MockedObject<ConfigService>;

  const MOCK_REDIS_CONFIG = {
    host: "localhost",
    port: 6379,
    username: "testuser",
    password: "testpass",
    queue: "testqueue",
  };

  const MOCK_PENDING_REGISTRATION: PendingRegistration = {
    id: "pending-123",
    provider: "discord",
    providerUserId: "discord-user-123",
    email: "test@example.com",
    name: "Test User",
    avatar: "https://example.com/avatar.png",
    createdAt: "2024-01-01T00:00:00.000Z",
  };

  const createMockConfigService = () => ({
    get: vi.fn().mockImplementation((key: string) => {
      if (key === "redis") return MOCK_REDIS_CONFIG;
      return undefined;
    }),
  });

  beforeEach(async () => {
    vi.clearAllMocks();

    // Reset mock implementations
    mockRedisInstance.setex.mockResolvedValue("OK");
    mockRedisInstance.get.mockResolvedValue(null);
    mockRedisInstance.del.mockResolvedValue(1);
    mockRedisInstance.quit.mockResolvedValue("OK");
    mockRedisInstance.disconnect.mockReturnValue(undefined);

    const module: TestingModule = await Test.createTestingModule({
      providers: [PendingRegistrationService, { provide: ConfigService, useValue: createMockConfigService() }],
    }).compile();

    service = module.get<PendingRegistrationService>(PendingRegistrationService);
    configService = module.get(ConfigService) as MockedObject<ConfigService>;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("constructor", () => {
    it("should create the service", () => {
      expect(service).toBeDefined();
    });
  });

  describe("create", () => {
    it("should create a pending registration and return the id", async () => {
      // Arrange
      const registrationData = {
        provider: "discord" as const,
        providerUserId: "discord-user-123",
        email: "test@example.com",
        name: "Test User",
        avatar: "https://example.com/avatar.png",
      };

      // Act
      const result = await service.create(registrationData);

      // Assert
      expect(result).toBe("mock-random-uuid");
      expect(mockRedisInstance.setex).toHaveBeenCalledWith(
        `${MOCK_REDIS_CONFIG.queue}:pending-registration:mock-random-uuid`,
        900,
        expect.stringContaining('"provider":"discord"'),
      );
    });

    it("should create registration without avatar", async () => {
      // Arrange
      const registrationData = {
        provider: "google" as const,
        providerUserId: "google-user-123",
        email: "google@example.com",
        name: "Google User",
      };

      // Act
      const result = await service.create(registrationData);

      // Assert
      expect(result).toBe("mock-random-uuid");
      expect(mockRedisInstance.setex).toHaveBeenCalled();
    });

    it("should store registration with correct TTL (15 minutes)", async () => {
      // Arrange
      const registrationData = {
        provider: "github" as const,
        providerUserId: "github-user-123",
        email: "github@example.com",
        name: "GitHub User",
      };

      // Act
      await service.create(registrationData);

      // Assert
      expect(mockRedisInstance.setex).toHaveBeenCalledWith(expect.any(String), 900, expect.any(String));
    });

    it("should include createdAt timestamp in stored data", async () => {
      // Arrange
      const registrationData = {
        provider: "discord" as const,
        providerUserId: "discord-user-123",
        email: "test@example.com",
        name: "Test User",
      };

      // Act
      await service.create(registrationData);

      // Assert
      const storedData = mockRedisInstance.setex.mock.calls[0][2];
      const parsed = JSON.parse(storedData);
      expect(parsed.createdAt).toBeDefined();
      expect(parsed.id).toBe("mock-random-uuid");
    });
  });

  describe("get", () => {
    it("should retrieve pending registration by id", async () => {
      // Arrange
      mockRedisInstance.get.mockResolvedValue(JSON.stringify(MOCK_PENDING_REGISTRATION));

      // Act
      const result = await service.get("pending-123");

      // Assert
      expect(mockRedisInstance.get).toHaveBeenCalledWith(`${MOCK_REDIS_CONFIG.queue}:pending-registration:pending-123`);
      expect(result).toEqual(MOCK_PENDING_REGISTRATION);
    });

    it("should return null when registration not found", async () => {
      // Arrange
      mockRedisInstance.get.mockResolvedValue(null);

      // Act
      const result = await service.get("nonexistent-id");

      // Assert
      expect(result).toBeNull();
    });

    it("should parse JSON data correctly", async () => {
      // Arrange
      const registrationWithAllFields: PendingRegistration = {
        id: "full-123",
        provider: "google",
        providerUserId: "google-12345",
        email: "full@example.com",
        name: "Full User",
        avatar: "https://example.com/full-avatar.png",
        createdAt: "2024-06-15T12:30:00.000Z",
      };
      mockRedisInstance.get.mockResolvedValue(JSON.stringify(registrationWithAllFields));

      // Act
      const result = await service.get("full-123");

      // Assert
      expect(result).toEqual(registrationWithAllFields);
      expect(result?.provider).toBe("google");
      expect(result?.avatar).toBe("https://example.com/full-avatar.png");
    });
  });

  describe("delete", () => {
    it("should delete pending registration by id", async () => {
      // Act
      await service.delete("pending-123");

      // Assert
      expect(mockRedisInstance.del).toHaveBeenCalledWith(`${MOCK_REDIS_CONFIG.queue}:pending-registration:pending-123`);
    });

    it("should not throw when deleting non-existent registration", async () => {
      // Arrange
      mockRedisInstance.del.mockResolvedValue(0);

      // Act & Assert
      await expect(service.delete("nonexistent-id")).resolves.toBeUndefined();
    });
  });

  describe("onModuleDestroy", () => {
    it("should close Redis connection gracefully", async () => {
      // Act
      await service.onModuleDestroy();

      // Assert
      expect(mockRedisInstance.quit).toHaveBeenCalled();
    });

    it("should disconnect on quit error", async () => {
      // Arrange
      mockRedisInstance.quit.mockRejectedValue(new Error("Quit failed"));
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      // Act
      await service.onModuleDestroy();

      // Assert
      expect(mockRedisInstance.disconnect).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith("Error closing Redis connection:", expect.any(Error));

      consoleSpy.mockRestore();
    });
  });
});
