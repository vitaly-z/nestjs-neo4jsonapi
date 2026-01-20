import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";
import { ExecutionContext, HttpException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ClsService } from "nestjs-cls";
import { ModuleRef } from "@nestjs/core";
import { JwtOrOAuthGuard } from "../jwt.or.oauth.guard";
import { OAuthTokenService } from "../../../foundations/oauth/services/oauth.token.service";
import { Neo4jService } from "../../../core/neo4j/services/neo4j.service";
import { JwtAuthGuard } from "../jwt.auth.guard";
import { OAUTH_SCOPES_KEY } from "../../decorators/oauth.scopes.decorator";

// Test IDs
const TEST_IDS = {
  userId: "660e8400-e29b-41d4-a716-446655440001",
  companyId: "550e8400-e29b-41d4-a716-446655440000",
  clientId: "770e8400-e29b-41d4-a716-446655440002",
};

// Mock factories
const createMockClsService = () => ({
  set: vi.fn(),
  get: vi.fn(),
});

const createMockReflector = () => ({
  get: vi.fn(),
  getAll: vi.fn(),
  getAllAndMerge: vi.fn(),
  getAllAndOverride: vi.fn(),
});

const createMockOAuthTokenService = () => ({
  validateAccessToken: vi.fn(),
  createAccessToken: vi.fn(),
  revokeToken: vi.fn(),
});

const createMockNeo4jService = () => ({
  writeOne: vi.fn(),
  readOne: vi.fn(),
  readMany: vi.fn(),
  initQuery: vi.fn(),
});

const createMockModuleRef = () => ({
  get: vi.fn(),
  resolve: vi.fn(),
  create: vi.fn(),
});

const createMockJwtAuthGuard = () => ({
  canActivate: vi.fn(),
});

const createMockExecutionContext = (options: { headers?: Record<string, string>; user?: any }): ExecutionContext => {
  const request = {
    headers: {
      authorization: options.headers?.authorization,
      "x-companyid": options.headers?.["x-companyid"],
      "x-language": options.headers?.["x-language"] ?? "en",
    },
    user: options.user,
  };

  return {
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => ({}),
      getNext: () => vi.fn(),
    }),
    getHandler: () => vi.fn(),
    getClass: () => vi.fn(),
    getArgs: () => [],
    getArgByIndex: () => null,
    switchToRpc: () => ({}) as any,
    switchToWs: () => ({}) as any,
    getType: () => "http" as const,
  } as ExecutionContext;
};

describe("JwtOrOAuthGuard", () => {
  let guard: JwtOrOAuthGuard;
  let tokenService: ReturnType<typeof createMockOAuthTokenService>;
  let reflector: ReturnType<typeof createMockReflector>;
  let clsService: ReturnType<typeof createMockClsService>;
  let moduleRef: ReturnType<typeof createMockModuleRef>;
  let mockJwtGuard: ReturnType<typeof createMockJwtAuthGuard>;

  const MOCK_OAUTH_TOKEN_DATA = {
    userId: TEST_IDS.userId,
    companyId: TEST_IDS.companyId,
    clientId: TEST_IDS.clientId,
    scope: "read write",
  };

  beforeEach(async () => {
    tokenService = createMockOAuthTokenService();
    reflector = createMockReflector();
    clsService = createMockClsService();
    moduleRef = createMockModuleRef();
    mockJwtGuard = createMockJwtAuthGuard();

    moduleRef.get.mockReturnValue(mockJwtGuard);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtOrOAuthGuard,
        { provide: OAuthTokenService, useValue: tokenService },
        { provide: Reflector, useValue: reflector },
        { provide: ClsService, useValue: clsService },
        { provide: Neo4jService, useValue: createMockNeo4jService() },
        { provide: ModuleRef, useValue: moduleRef },
      ],
    }).compile();

    guard = module.get<JwtOrOAuthGuard>(JwtOrOAuthGuard);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("canActivate", () => {
    it("should throw Missing authorization when no auth header", async () => {
      const context = createMockExecutionContext({ headers: {} });

      await expect(guard.canActivate(context)).rejects.toThrow(HttpException);
      await expect(guard.canActivate(context)).rejects.toThrow("Missing authorization");
    });

    it("should validate OAuth token successfully", async () => {
      const context = createMockExecutionContext({
        headers: { authorization: "Bearer oauth-token" },
      });
      tokenService.validateAccessToken.mockResolvedValue(MOCK_OAUTH_TOKEN_DATA);
      reflector.getAllAndOverride.mockReturnValue(null);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(tokenService.validateAccessToken).toHaveBeenCalledWith("oauth-token");
      expect(clsService.set).toHaveBeenCalledWith("userId", TEST_IDS.userId);
      expect(clsService.set).toHaveBeenCalledWith("companyId", TEST_IDS.companyId);
      expect(clsService.set).toHaveBeenCalledWith("oauthClientId", TEST_IDS.clientId);
      expect(clsService.set).toHaveBeenCalledWith("oauthScopes", "read write");
      expect(clsService.set).toHaveBeenCalledWith("authType", "oauth");
    });

    it("should set request.user for OAuth token", async () => {
      const context = createMockExecutionContext({
        headers: { authorization: "Bearer oauth-token" },
      });
      tokenService.validateAccessToken.mockResolvedValue(MOCK_OAUTH_TOKEN_DATA);
      reflector.getAllAndOverride.mockReturnValue(null);

      await guard.canActivate(context);

      const request = context.switchToHttp().getRequest();
      expect(request.user).toEqual({
        userId: TEST_IDS.userId,
        companyId: TEST_IDS.companyId,
        clientId: TEST_IDS.clientId,
        scopes: ["read", "write"],
      });
    });

    it("should check required scopes for OAuth token", async () => {
      const context = createMockExecutionContext({
        headers: { authorization: "Bearer oauth-token" },
      });
      tokenService.validateAccessToken.mockResolvedValue(MOCK_OAUTH_TOKEN_DATA);
      reflector.getAllAndOverride.mockReturnValue(["read"]);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(OAUTH_SCOPES_KEY, expect.any(Array));
    });

    it("should throw Insufficient scope when OAuth token lacks required scopes", async () => {
      const context = createMockExecutionContext({
        headers: { authorization: "Bearer oauth-token" },
      });
      tokenService.validateAccessToken.mockResolvedValue(MOCK_OAUTH_TOKEN_DATA);
      reflector.getAllAndOverride.mockReturnValue(["admin"]);

      await expect(guard.canActivate(context)).rejects.toThrow(HttpException);
      await expect(guard.canActivate(context)).rejects.toThrow("Insufficient scope");
    });

    it("should fall back to JWT when OAuth validation returns null", async () => {
      const context = createMockExecutionContext({
        headers: { authorization: "Bearer jwt-token" },
      });
      tokenService.validateAccessToken.mockResolvedValue(null);
      mockJwtGuard.canActivate.mockResolvedValue(true);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(moduleRef.get).toHaveBeenCalledWith(JwtAuthGuard, { strict: false });
      expect(mockJwtGuard.canActivate).toHaveBeenCalledWith(context);
    });

    it("should fall back to JWT when OAuth validation throws non-HttpException", async () => {
      const context = createMockExecutionContext({
        headers: { authorization: "Bearer jwt-token" },
      });
      tokenService.validateAccessToken.mockRejectedValue(new Error("Token format error"));
      mockJwtGuard.canActivate.mockResolvedValue(true);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(mockJwtGuard.canActivate).toHaveBeenCalled();
    });

    it("should re-throw HttpException from OAuth validation", async () => {
      const context = createMockExecutionContext({
        headers: { authorization: "Bearer oauth-token" },
      });
      tokenService.validateAccessToken.mockResolvedValue(MOCK_OAUTH_TOKEN_DATA);
      reflector.getAllAndOverride.mockReturnValue(["admin"]);

      await expect(guard.canActivate(context)).rejects.toThrow("Insufficient scope");
    });

    it("should throw Invalid authentication when JWT guard fails", async () => {
      const context = createMockExecutionContext({
        headers: { authorization: "Bearer invalid-token" },
      });
      tokenService.validateAccessToken.mockResolvedValue(null);
      mockJwtGuard.canActivate.mockRejectedValue(new Error("JWT validation failed"));

      await expect(guard.canActivate(context)).rejects.toThrow(HttpException);
      await expect(guard.canActivate(context)).rejects.toThrow("Invalid authentication");
    });

    it("should not try OAuth for non-Bearer tokens", async () => {
      const context = createMockExecutionContext({
        headers: { authorization: "Basic dXNlcjpwYXNz" },
      });
      mockJwtGuard.canActivate.mockResolvedValue(true);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(tokenService.validateAccessToken).not.toHaveBeenCalled();
      expect(mockJwtGuard.canActivate).toHaveBeenCalled();
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty scopes in token", async () => {
      const context = createMockExecutionContext({
        headers: { authorization: "Bearer oauth-token" },
      });
      const tokenWithEmptyScope = { ...MOCK_OAUTH_TOKEN_DATA, scope: "" };
      tokenService.validateAccessToken.mockResolvedValue(tokenWithEmptyScope);
      reflector.getAllAndOverride.mockReturnValue(null);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });

    it("should handle single scope in token", async () => {
      const context = createMockExecutionContext({
        headers: { authorization: "Bearer oauth-token" },
      });
      const tokenWithSingleScope = { ...MOCK_OAUTH_TOKEN_DATA, scope: "read" };
      tokenService.validateAccessToken.mockResolvedValue(tokenWithSingleScope);
      reflector.getAllAndOverride.mockReturnValue(["read"]);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });

    it("should handle multiple required scopes all present", async () => {
      const context = createMockExecutionContext({
        headers: { authorization: "Bearer oauth-token" },
      });
      tokenService.validateAccessToken.mockResolvedValue(MOCK_OAUTH_TOKEN_DATA);
      reflector.getAllAndOverride.mockReturnValue(["read", "write"]);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });

    it("should fail when one of multiple required scopes is missing", async () => {
      const context = createMockExecutionContext({
        headers: { authorization: "Bearer oauth-token" },
      });
      tokenService.validateAccessToken.mockResolvedValue(MOCK_OAUTH_TOKEN_DATA);
      reflector.getAllAndOverride.mockReturnValue(["read", "delete"]);

      await expect(guard.canActivate(context)).rejects.toThrow("Insufficient scope");
    });
  });
});
