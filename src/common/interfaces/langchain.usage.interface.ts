/**
 * LangChain v1.0 Usage Metadata Interface
 * Represents token usage information returned by LLM providers
 *
 * @see https://js.langchain.com/docs/how_to/chat_token_usage_tracking/
 */
export interface UsageMetadata {
  /**
   * Number of tokens used in the input/prompt
   */
  input_tokens: number;

  /**
   * Number of tokens generated in the output/completion
   */
  output_tokens: number;

  /**
   * Total tokens used (input + output)
   */
  total_tokens: number;
}
