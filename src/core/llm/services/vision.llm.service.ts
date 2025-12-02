import { HumanMessage } from "@langchain/core/messages";
import { Injectable } from "@nestjs/common";
import { ModelService } from "../../llm/services/model.service";
import { ZodType } from "zod";

/**
 * Parameters for Vision LLM service calls
 */
interface VisionCallParams<T> {
  image: string;
  systemPrompt: string;
  outputSchema: ZodType<T>;
  temperature?: number;
}

/**
 * Raw LLM response structure with usage metadata
 */
interface LLMRawResponse {
  usage_metadata?: {
    input_tokens?: number;
    output_tokens?: number;
  };
  response_metadata?: {
    finish_reason?: string;
    [key: string]: unknown;
  };
  content?: string;
}

/**
 * Type guard to validate raw response structure
 */
function isValidRaw(raw: unknown): raw is LLMRawResponse {
  return typeof raw === "object" && raw !== null;
}

/**
 * Structured output response from LLM
 */
interface StructuredOutputResponse<T> {
  parsed: T | null;
  raw?: LLMRawResponse;
}

@Injectable()
export class VisionLLMService {
  constructor(private readonly modelService: ModelService) {}

  /**
   * Fetches an image from a URL and converts it to a base64 data URL.
   * Required because OpenRouter cannot access local/private URLs.
   */
  private async fetchImageAsBase64(image: string): Promise<string> {
    const response = await fetch(image);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
    }

    const contentType = response.headers.get("content-type") || "image/jpeg";
    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");

    return `data:${contentType};base64,${base64}`;
  }

  /**
   * Calls the LLM with an image for vision analysis using structured output.
   *
   * This method follows the same pattern as LLMService:
   * 1. Gets the base model from ModelService
   * 2. Wraps it with withStructuredOutput for schema enforcement
   * 3. Creates a multimodal HumanMessage with text and image
   * 4. Invokes the structured LLM directly
   * 5. Returns parsed response with token usage metadata
   *
   * @template T - The expected output type (inferred from outputSchema)
   * @param params - Call parameters
   * @param params.image - URL of the image to analyze (will be converted to base64)
   * @param params.systemPrompt - System prompt for the vision analysis
   * @param params.outputSchema - Zod schema defining expected LLM response structure
   * @param params.temperature - Optional temperature override (default: 0.1)
   * @returns Promise resolving to parsed output + token usage metadata
   * @throws {Error} If LLM call fails or returns invalid structured output
   */
  async call<T>(params: VisionCallParams<T>): Promise<T & { tokenUsage: { input: number; output: number } }> {
    try {
      const baseModel = this.modelService.getLLM({
        temperature: params.temperature ?? 0.1,
      });

      const structuredLlm = baseModel.withStructuredOutput(params.outputSchema, {
        includeRaw: true,
      });

      const message = new HumanMessage({
        content: [
          {
            type: "text",
            text: params.systemPrompt,
          },
          {
            type: "image_url",
            image_url: {
              url: params.image,
            },
          },
        ],
      });

      const response = (await structuredLlm.invoke([message])) as unknown as StructuredOutputResponse<T>;

      // Extract token usage with type guard - same pattern as LLMService
      const raw = isValidRaw(response.raw) ? response.raw : undefined;
      const input = raw?.usage_metadata?.input_tokens ?? 0;
      const output = raw?.usage_metadata?.output_tokens ?? 0;

      return {
        ...(response.parsed as T),
        tokenUsage: {
          input,
          output,
        },
      };
    } catch (error) {
      console.error("[VisionLLMService] Error calling LLM:", error);
      throw new Error(`Vision LLM service error: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }
}
