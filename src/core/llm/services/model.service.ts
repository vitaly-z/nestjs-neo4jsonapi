import { EmbeddingsInterface } from "@langchain/core/embeddings";
import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { AzureOpenAIEmbeddings, ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as fs from "fs";
import { ClsService } from "nestjs-cls";
import OpenAI, { AzureOpenAI } from "openai";
import { BaseConfigInterface, ConfigAiInterface } from "../../../config/interfaces";

interface LLMParameters {
  apiKey: string;
  temperature: number;
  model: string;
  configuration: {
    baseURL: string;
    defaultHeaders?: Record<string, string>;
  };
  modelKwargs?: Record<string, unknown>;
}

@Injectable()
export class ModelService {
  private _modelCache: Map<string, BaseChatModel>;

  constructor(
    private readonly clsService: ClsService,
    private readonly configService: ConfigService<BaseConfigInterface>,
  ) {
    this._modelCache = new Map();
  }

  private get aiConfig(): ConfigAiInterface {
    return this.configService.get<ConfigAiInterface>("ai");
  }

  /**
   * Gets a configured LLM instance based on the current config.
   *
   * Uses caching to reuse model instances with the same configuration,
   * improving performance by avoiding repeated instantiation.
   *
   * Supports multiple providers:
   * - `llamacpp`/`local`: Local llama.cpp server (OpenAI-compatible API)
   * - `openrouter`: OpenRouter cloud service
   *
   * @param params - Optional parameters
   * @param params.temperature - Temperature for text generation (0-2, default: 0.2)
   *                             Lower = more deterministic, Higher = more creative
   * @returns Configured BaseChatModel instance from LangChain (cached if available)
   * @throws {Error} If the configured LLM type is not supported
   *
   * @example
   * ```typescript
   * const chatModelService = new ChatModelService();
   * const model = chatModelService.getLLM({ temperature: 0.8 });
   * // Second call with same temperature returns cached instance
   * const sameModel = chatModelService.getLLM({ temperature: 0.8 });
   * ```
   */
  getLLM(params?: { temperature?: number }): BaseChatModel {
    const temperature = params?.temperature ?? 0.2;

    // Create cache key based on type, temperature, and region (for provider routing)
    const cacheKey = `${this.aiConfig.ai.provider}-${temperature}-${this.aiConfig.ai.region || "default"}`;

    // Return cached instance if available
    if (this._modelCache.has(cacheKey)) {
      return this._modelCache.get(cacheKey)!;
    }

    // Base configuration shared by all providers
    const llmConfig: LLMParameters = {
      apiKey: this.aiConfig.ai.apiKey || "not-needed",
      temperature,
      model: this.aiConfig.ai.model || "local-model",
      configuration: {
        baseURL: this.aiConfig.ai.url || "http://localhost:8033/v1",
      },
    };

    // Provider-specific overrides
    switch (this.aiConfig.ai.provider) {
      case "llamacpp":
        // Local models don't need API keys
        llmConfig.apiKey = "not-needed";
        llmConfig.model = "local-model";
        llmConfig.configuration.baseURL = this.aiConfig.ai.url || "http://localhost:8033/v1";
        break;

      case "openrouter":
        // OpenRouter uses configured values with required headers
        llmConfig.configuration.baseURL = this.aiConfig.ai.url || "https://openrouter.ai/api/v1";
        // Add provider routing if region is configured
        if (this.aiConfig.ai.region) {
          llmConfig.modelKwargs = {
            provider: {
              order: [this.aiConfig.ai.region],
              allow_fallbacks: true,
            },
          };
        }
        break;

      default:
        throw new Error(`Unsupported LLM type: ${this.aiConfig.ai.provider}`);
    }

    // Create and cache new model instance
    const model = new ChatOpenAI(llmConfig);
    this._modelCache.set(cacheKey, model);

    return model;
  }

  /**
   * Clears the model cache.
   *
   * Useful when configuration changes or to free up memory.
   */
  clearCache(): void {
    this._modelCache.clear();
  }

  /**
   * Gets the number of cached model instances.
   *
   * @returns Number of cached models
   */
  getCacheSize(): number {
    return this._modelCache.size;
  }

  getEmbedder(): EmbeddingsInterface {
    let response: EmbeddingsInterface;

    switch (this.aiConfig.embedder.provider) {
      case "local":
        throw new Error("Local embedder is not supported");
      case "openrouter":
        response = new OpenAIEmbeddings({
          openAIApiKey: this.aiConfig.embedder.apiKey,
          model: this.aiConfig.embedder.model,
          configuration: {
            baseURL: this.aiConfig.embedder.url,
          },
        });

        break;
      case "openai":
        response = new OpenAIEmbeddings({
          openAIApiKey: this.aiConfig.embedder.apiKey,
          model: this.aiConfig.embedder.model,
        });
        break;
      case "azure":
        response = new AzureOpenAIEmbeddings({
          azureOpenAIApiKey: this.aiConfig.embedder.apiKey,
          azureOpenAIApiInstanceName: this.aiConfig.embedder.instance,
          azureOpenAIApiDeploymentName: this.aiConfig.embedder.model,
          azureOpenAIApiVersion: this.aiConfig.embedder.apiVersion,
        });
        break;
    }

    return response;
  }

  getTranscriber(): any {
    let response: any;
    switch (this.aiConfig.transcriber.provider) {
      case "openai":
        response = new OpenAI({
          apiKey: this.aiConfig.transcriber.apiKey,
        });
        break;
      case "azure":
        response = new AzureOpenAI({
          apiKey: this.aiConfig.transcriber.apiKey,
          apiVersion: this.aiConfig.transcriber.apiVersion,
          endpoint: this.aiConfig.transcriber.url,
          deployment: this.aiConfig.transcriber.model,
        });
        break;
    }
    return response;
  }

  async transcribeAudio(params: { filePath: string; prompt: string; language?: string }): Promise<any> {
    return await this.getTranscriber().audio.transcriptions.create({
      file: fs.createReadStream(params.filePath),
      model: this.aiConfig.transcriber.model,
      prompt: params.prompt,
      response_format: "json",
    });
  }

  async vectoriseText(params: { text: string }): Promise<any> {
    return this.getEmbedder().embedQuery(params.text);
  }

  async vectoriseTextBatch(texts: string[]): Promise<any[]> {
    return this.getEmbedder().embedDocuments(texts);
  }
}
