import { vi, describe, it, expect, beforeEach, afterEach, MockedObject } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";
import { ResponderService } from "../responder.service";
import { ResponderContextFactoryService } from "../../factories/responder.context.factory";
import { ContextualiserService } from "../../../contextualiser/services/contextualiser.service";
import { DriftSearchService } from "../../../drift/services/drift.search.service";
import { ResponderAnswerNodeService } from "../../nodes/responder.answer.node.service";
import { ResponderContextState } from "../../contexts/responder.context";

describe("ResponderService", () => {
  let service: ResponderService;
  let contextFactoryService: MockedObject<ResponderContextFactoryService>;
  let contextualiserService: MockedObject<ContextualiserService>;
  let driftSearchService: MockedObject<DriftSearchService>;
  let answerNode: MockedObject<ResponderAnswerNodeService>;

  const TEST_IDS = {
    companyId: "550e8400-e29b-41d4-a716-446655440000",
    contentId: "660e8400-e29b-41d4-a716-446655440001",
  };

  const MOCK_MESSAGES = [{ role: "user" as const, content: "What is the main topic?" }];

  const MOCK_DATA_LIMITS = {
    chunks: { total: 100, perContent: 50 },
    communities: { total: 50, perLevel: 10 },
  };

  const createMockContextFactoryService = () => ({
    create: vi.fn(),
    createAnswer: vi.fn(),
  });

  const createMockContextualiserService = () => ({
    run: vi.fn(),
  });

  const createMockDriftSearchService = () => ({
    search: vi.fn(),
    quickSearch: vi.fn(),
  });

  const createMockAnswerNode = () => ({
    execute: vi.fn(),
  });

  const createInitialState = (overrides?: Partial<ResponderContextState>): ResponderContextState => ({
    companyId: TEST_IDS.companyId,
    contentId: TEST_IDS.contentId,
    contentType: "Document",
    dataLimits: MOCK_DATA_LIMITS,
    useDrift: false,
    context: null,
    driftContext: null,
    response: "",
    tokens: { input: 0, output: 0 },
    ...overrides,
  });

  const createContextualiserResponse = () => ({
    chunks: [{ id: "chunk1", content: "Some content" }],
    atomicFacts: [{ content: "Fact 1", keyConcepts: ["concept1"] }],
    communities: [],
    tokens: { input: 50, output: 25 },
  });

  const createDriftSearchResponse = () => ({
    answer: "DRIFT answer",
    matchedCommunities: [{ id: "comm1", name: "Community 1" }],
    followUpAnswers: [],
    initialAnswer: "Initial answer",
    confidence: 0.85,
    hydeEmbedding: [0.1, 0.2],
  });

  const createAnswerNodeResponse = (state: ResponderContextState): Partial<ResponderContextState> => ({
    response: "Final response based on context",
    tokens: { input: state.tokens.input + 100, output: state.tokens.output + 50 },
  });

  beforeEach(async () => {
    vi.clearAllMocks();

    const mockContextFactoryService = createMockContextFactoryService();
    const mockContextualiserService = createMockContextualiserService();
    const mockDriftSearchService = createMockDriftSearchService();
    const mockAnswerNode = createMockAnswerNode();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResponderService,
        { provide: ResponderContextFactoryService, useValue: mockContextFactoryService },
        { provide: ContextualiserService, useValue: mockContextualiserService },
        { provide: DriftSearchService, useValue: mockDriftSearchService },
        { provide: ResponderAnswerNodeService, useValue: mockAnswerNode },
      ],
    }).compile();

    service = module.get<ResponderService>(ResponderService);
    contextFactoryService = module.get(ResponderContextFactoryService) as MockedObject<ResponderContextFactoryService>;
    contextualiserService = module.get(ContextualiserService) as MockedObject<ContextualiserService>;
    driftSearchService = module.get(DriftSearchService) as MockedObject<DriftSearchService>;
    answerNode = module.get(ResponderAnswerNodeService) as MockedObject<ResponderAnswerNodeService>;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("constructor", () => {
    it("should create the service", () => {
      expect(service).toBeDefined();
    });
  });

  describe("run", () => {
    it("should execute workflow without DRIFT when useDrift is false", async () => {
      // Arrange
      const initialState = createInitialState({ useDrift: false });
      const contextualiserResponse = createContextualiserResponse();

      contextFactoryService.create.mockReturnValue(initialState);
      contextualiserService.run.mockResolvedValue(contextualiserResponse);
      answerNode.execute.mockImplementation(async ({ state }) => createAnswerNodeResponse(state));
      contextFactoryService.createAnswer.mockReturnValue({
        response: "Final response",
        tokens: { input: 150, output: 75 },
      });

      // Act
      const result = await service.run({
        companyId: TEST_IDS.companyId,
        contentId: TEST_IDS.contentId,
        contentType: "Document",
        dataLimits: MOCK_DATA_LIMITS,
        messages: MOCK_MESSAGES,
      });

      // Assert
      expect(contextualiserService.run).toHaveBeenCalled();
      expect(driftSearchService.search).not.toHaveBeenCalled();
      expect(answerNode.execute).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it("should execute workflow with DRIFT when useDrift is true", async () => {
      // Arrange
      const initialState = createInitialState({ useDrift: true });
      const contextualiserResponse = createContextualiserResponse();
      const driftResponse = createDriftSearchResponse();

      contextFactoryService.create.mockReturnValue(initialState);
      contextualiserService.run.mockResolvedValue(contextualiserResponse);
      driftSearchService.search.mockResolvedValue(driftResponse);
      answerNode.execute.mockImplementation(async ({ state }) => createAnswerNodeResponse(state));
      contextFactoryService.createAnswer.mockReturnValue({
        response: "Final response with DRIFT",
        tokens: { input: 200, output: 100 },
      });

      // Act
      const result = await service.run({
        companyId: TEST_IDS.companyId,
        contentId: TEST_IDS.contentId,
        contentType: "Document",
        dataLimits: MOCK_DATA_LIMITS,
        messages: MOCK_MESSAGES,
        useDrift: true,
      });

      // Assert
      expect(contextualiserService.run).toHaveBeenCalled();
      expect(driftSearchService.search).toHaveBeenCalled();
      expect(answerNode.execute).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it("should pass correct parameters to contextualiser", async () => {
      // Arrange
      const initialState = createInitialState();
      contextFactoryService.create.mockReturnValue(initialState);
      contextualiserService.run.mockResolvedValue(createContextualiserResponse());
      answerNode.execute.mockImplementation(async ({ state }) => createAnswerNodeResponse(state));
      contextFactoryService.createAnswer.mockReturnValue({
        response: "Response",
        tokens: { input: 150, output: 75 },
      });

      // Act
      await service.run({
        companyId: TEST_IDS.companyId,
        contentId: TEST_IDS.contentId,
        contentType: "Document",
        dataLimits: MOCK_DATA_LIMITS,
        messages: MOCK_MESSAGES,
        question: "What is this about?",
      });

      // Assert
      expect(contextualiserService.run).toHaveBeenCalledWith(
        expect.objectContaining({
          companyId: TEST_IDS.companyId,
          contentId: TEST_IDS.contentId,
          contentType: "Document",
          dataLimits: MOCK_DATA_LIMITS,
          messages: MOCK_MESSAGES,
          question: "What is this about?",
        }),
      );
    });

    it("should pass question to DRIFT search when provided", async () => {
      // Arrange
      const initialState = createInitialState({ useDrift: true });
      contextFactoryService.create.mockReturnValue(initialState);
      contextualiserService.run.mockResolvedValue(createContextualiserResponse());
      driftSearchService.search.mockResolvedValue(createDriftSearchResponse());
      answerNode.execute.mockImplementation(async ({ state }) => createAnswerNodeResponse(state));
      contextFactoryService.createAnswer.mockReturnValue({
        response: "Response",
        tokens: { input: 200, output: 100 },
      });

      // Act
      await service.run({
        companyId: TEST_IDS.companyId,
        contentId: TEST_IDS.contentId,
        contentType: "Document",
        dataLimits: MOCK_DATA_LIMITS,
        messages: MOCK_MESSAGES,
        useDrift: true,
        question: "What is the main topic?",
      });

      // Assert
      expect(driftSearchService.search).toHaveBeenCalledWith(
        expect.objectContaining({
          question: "What is the main topic?",
        }),
      );
    });

    it("should use last message content when question is not provided", async () => {
      // Arrange
      const initialState = createInitialState({ useDrift: true });
      const messages = [
        { role: "assistant" as const, content: "Hello" },
        { role: "user" as const, content: "Tell me about the document" },
      ];

      contextFactoryService.create.mockReturnValue(initialState);
      contextualiserService.run.mockResolvedValue(createContextualiserResponse());
      driftSearchService.search.mockResolvedValue(createDriftSearchResponse());
      answerNode.execute.mockImplementation(async ({ state }) => createAnswerNodeResponse(state));
      contextFactoryService.createAnswer.mockReturnValue({
        response: "Response",
        tokens: { input: 200, output: 100 },
      });

      // Act
      await service.run({
        companyId: TEST_IDS.companyId,
        contentId: TEST_IDS.contentId,
        contentType: "Document",
        dataLimits: MOCK_DATA_LIMITS,
        messages,
        useDrift: true,
      });

      // Assert
      expect(driftSearchService.search).toHaveBeenCalledWith(
        expect.objectContaining({
          question: "Tell me about the document",
        }),
      );
    });

    it("should parse JSON question content if it's a stringified message", async () => {
      // Arrange
      const initialState = createInitialState({ useDrift: true });
      const jsonQuestion = JSON.stringify({ content: "Extracted question", role: "user" });

      contextFactoryService.create.mockReturnValue(initialState);
      contextualiserService.run.mockResolvedValue(createContextualiserResponse());
      driftSearchService.search.mockResolvedValue(createDriftSearchResponse());
      answerNode.execute.mockImplementation(async ({ state }) => createAnswerNodeResponse(state));
      contextFactoryService.createAnswer.mockReturnValue({
        response: "Response",
        tokens: { input: 200, output: 100 },
      });

      // Act
      await service.run({
        companyId: TEST_IDS.companyId,
        contentId: TEST_IDS.contentId,
        contentType: "Document",
        dataLimits: MOCK_DATA_LIMITS,
        messages: MOCK_MESSAGES,
        useDrift: true,
        question: jsonQuestion,
      });

      // Assert
      expect(driftSearchService.search).toHaveBeenCalledWith(
        expect.objectContaining({
          question: "Extracted question",
        }),
      );
    });

    it("should pass DRIFT config when provided", async () => {
      // Arrange
      const initialState = createInitialState({ useDrift: true });
      const driftConfig = { primerTopK: 10, followUpDepth: 3 };

      contextFactoryService.create.mockReturnValue(initialState);
      contextualiserService.run.mockResolvedValue(createContextualiserResponse());
      driftSearchService.search.mockResolvedValue(createDriftSearchResponse());
      answerNode.execute.mockImplementation(async ({ state }) => createAnswerNodeResponse(state));
      contextFactoryService.createAnswer.mockReturnValue({
        response: "Response",
        tokens: { input: 200, output: 100 },
      });

      // Act
      await service.run({
        companyId: TEST_IDS.companyId,
        contentId: TEST_IDS.contentId,
        contentType: "Document",
        dataLimits: MOCK_DATA_LIMITS,
        messages: MOCK_MESSAGES,
        useDrift: true,
        driftConfig,
      });

      // Assert
      expect(driftSearchService.search).toHaveBeenCalledWith(
        expect.objectContaining({
          config: driftConfig,
        }),
      );
    });

    it("should create initial state via factory service", async () => {
      // Arrange
      const initialState = createInitialState();
      contextFactoryService.create.mockReturnValue(initialState);
      contextualiserService.run.mockResolvedValue(createContextualiserResponse());
      answerNode.execute.mockImplementation(async ({ state }) => createAnswerNodeResponse(state));
      contextFactoryService.createAnswer.mockReturnValue({
        response: "Response",
        tokens: { input: 150, output: 75 },
      });

      // Act
      await service.run({
        companyId: TEST_IDS.companyId,
        contentId: TEST_IDS.contentId,
        contentType: "Document",
        dataLimits: MOCK_DATA_LIMITS,
        messages: MOCK_MESSAGES,
      });

      // Assert
      expect(contextFactoryService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          companyId: TEST_IDS.companyId,
          contentId: TEST_IDS.contentId,
          contentType: "Document",
          dataLimits: MOCK_DATA_LIMITS,
          useDrift: false,
        }),
      );
    });

    it("should create answer via factory service", async () => {
      // Arrange
      const initialState = createInitialState();
      contextFactoryService.create.mockReturnValue(initialState);
      contextualiserService.run.mockResolvedValue(createContextualiserResponse());
      answerNode.execute.mockImplementation(async ({ state }) => createAnswerNodeResponse(state));
      contextFactoryService.createAnswer.mockReturnValue({
        response: "Final response",
        tokens: { input: 150, output: 75 },
      });

      // Act
      await service.run({
        companyId: TEST_IDS.companyId,
        contentId: TEST_IDS.contentId,
        contentType: "Document",
        dataLimits: MOCK_DATA_LIMITS,
        messages: MOCK_MESSAGES,
      });

      // Assert
      expect(contextFactoryService.createAnswer).toHaveBeenCalledWith(
        expect.objectContaining({
          state: expect.any(Object),
        }),
      );
    });

    it("should throw error when workflow fails", async () => {
      // Arrange
      const initialState = createInitialState();
      contextFactoryService.create.mockReturnValue(initialState);
      contextualiserService.run.mockRejectedValue(new Error("Contextualiser failed"));

      // Act & Assert
      await expect(
        service.run({
          companyId: TEST_IDS.companyId,
          contentId: TEST_IDS.contentId,
          contentType: "Document",
          dataLimits: MOCK_DATA_LIMITS,
          messages: MOCK_MESSAGES,
        }),
      ).rejects.toThrow("Contextualiser failed");
    });

    it("should default useDrift to false when not provided", async () => {
      // Arrange
      const initialState = createInitialState({ useDrift: false });
      contextFactoryService.create.mockReturnValue(initialState);
      contextualiserService.run.mockResolvedValue(createContextualiserResponse());
      answerNode.execute.mockImplementation(async ({ state }) => createAnswerNodeResponse(state));
      contextFactoryService.createAnswer.mockReturnValue({
        response: "Response",
        tokens: { input: 150, output: 75 },
      });

      // Act
      await service.run({
        companyId: TEST_IDS.companyId,
        contentId: TEST_IDS.contentId,
        contentType: "Document",
        dataLimits: MOCK_DATA_LIMITS,
        messages: MOCK_MESSAGES,
      });

      // Assert
      expect(contextFactoryService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          useDrift: false,
        }),
      );
    });
  });

  describe("runWithDrift", () => {
    it("should call run with useDrift set to true", async () => {
      // Arrange
      const initialState = createInitialState({ useDrift: true });
      contextFactoryService.create.mockReturnValue(initialState);
      contextualiserService.run.mockResolvedValue(createContextualiserResponse());
      driftSearchService.search.mockResolvedValue(createDriftSearchResponse());
      answerNode.execute.mockImplementation(async ({ state }) => createAnswerNodeResponse(state));
      contextFactoryService.createAnswer.mockReturnValue({
        response: "Response with DRIFT",
        tokens: { input: 200, output: 100 },
      });

      // Act
      const result = await service.runWithDrift({
        companyId: TEST_IDS.companyId,
        contentId: TEST_IDS.contentId,
        contentType: "Document",
        dataLimits: MOCK_DATA_LIMITS,
        messages: MOCK_MESSAGES,
      });

      // Assert
      expect(driftSearchService.search).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it("should pass driftConfig to run", async () => {
      // Arrange
      const initialState = createInitialState({ useDrift: true });
      const driftConfig = { primerTopK: 15, followUpDepth: 2 };

      contextFactoryService.create.mockReturnValue(initialState);
      contextualiserService.run.mockResolvedValue(createContextualiserResponse());
      driftSearchService.search.mockResolvedValue(createDriftSearchResponse());
      answerNode.execute.mockImplementation(async ({ state }) => createAnswerNodeResponse(state));
      contextFactoryService.createAnswer.mockReturnValue({
        response: "Response",
        tokens: { input: 200, output: 100 },
      });

      // Act
      await service.runWithDrift({
        companyId: TEST_IDS.companyId,
        contentId: TEST_IDS.contentId,
        contentType: "Document",
        dataLimits: MOCK_DATA_LIMITS,
        messages: MOCK_MESSAGES,
        driftConfig,
      });

      // Assert
      expect(driftSearchService.search).toHaveBeenCalledWith(
        expect.objectContaining({
          config: driftConfig,
        }),
      );
    });

    it("should pass question to run", async () => {
      // Arrange
      const initialState = createInitialState({ useDrift: true });

      contextFactoryService.create.mockReturnValue(initialState);
      contextualiserService.run.mockResolvedValue(createContextualiserResponse());
      driftSearchService.search.mockResolvedValue(createDriftSearchResponse());
      answerNode.execute.mockImplementation(async ({ state }) => createAnswerNodeResponse(state));
      contextFactoryService.createAnswer.mockReturnValue({
        response: "Response",
        tokens: { input: 200, output: 100 },
      });

      // Act
      await service.runWithDrift({
        companyId: TEST_IDS.companyId,
        contentId: TEST_IDS.contentId,
        contentType: "Document",
        dataLimits: MOCK_DATA_LIMITS,
        messages: MOCK_MESSAGES,
        question: "Specific question",
      });

      // Assert
      expect(driftSearchService.search).toHaveBeenCalledWith(
        expect.objectContaining({
          question: "Specific question",
        }),
      );
    });
  });
});
