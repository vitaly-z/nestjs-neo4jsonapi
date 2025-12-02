/**
 * Interfaces for agent prompt customization
 *
 * These interfaces define the structure for custom prompts that can be
 * passed to agent modules via forRoot() method.
 *
 * All prompts are OPTIONAL - the library includes default prompts that
 * work out of the box.
 */

/**
 * Custom prompts for the Contextualiser agent (GraphRAG)
 *
 * The Contextualiser uses multiple nodes to traverse the knowledge graph:
 * - questionRefiner: Refines user questions based on conversation history
 * - rationalPlan: Creates a rational plan to answer the question
 * - keyConcepts: Scores key concepts for relevance
 * - atomicFacts: Evaluates atomic facts for context
 * - chunk: Assesses text chunks for information
 * - chunkVector: (if using vector-based chunk retrieval)
 */
export interface ContextualiserPromptsOptions {
  /**
   * Prompt for refining user questions based on conversation history
   */
  questionRefiner?: string;

  /**
   * Prompt for creating a rational plan to answer the question
   */
  rationalPlan?: string;

  /**
   * Prompt for scoring key concepts for relevance
   */
  keyConcepts?: string;

  /**
   * Prompt for evaluating atomic facts for context
   */
  atomicFacts?: string;

  /**
   * Prompt for assessing text chunks for information
   */
  chunk?: string;

  /**
   * Prompt for vector-based chunk assessment (optional)
   */
  chunkVector?: string;
}

/**
 * Custom prompts for the Summariser agent
 *
 * The Summariser uses a map-reduce pattern:
 * - map: Summarizes individual chunks
 * - combine: Combines multiple summaries into one
 * - tldr: Creates a very short one-sentence summary
 */
export interface SummariserPromptsOptions {
  /**
   * Prompt for summarizing individual chunks (map phase)
   */
  map?: string;

  /**
   * Prompt for combining multiple summaries (reduce phase)
   */
  combine?: string;

  /**
   * Prompt for creating a one-sentence TLDR
   */
  tldr?: string;
}

/**
 * Options for GraphCreatorModule.forRoot()
 */
export interface GraphCreatorModuleOptions {
  /**
   * Custom prompt for extracting atomic facts and key concepts
   */
  prompt?: string;
}

/**
 * Options for ContextualiserModule.forRoot()
 */
export interface ContextualiserModuleOptions {
  /**
   * Custom prompts for Contextualiser nodes
   */
  prompts?: ContextualiserPromptsOptions;
}

/**
 * Options for ResponderModule.forRoot()
 */
export interface ResponderModuleOptions {
  /**
   * Custom prompt for generating final answers
   */
  prompt?: string;
}

/**
 * Options for SummariserModule.forRoot()
 */
export interface SummariserModuleOptions {
  /**
   * Custom prompts for Summariser operations
   */
  prompts?: SummariserPromptsOptions;
}

/**
 * Combined options for all agent prompts
 *
 * Can be used with AgentsModule.forRoot() for centralized configuration
 */
export interface AgentPromptsOptions {
  /**
   * Custom prompt for GraphCreator agent
   */
  graphCreator?: string;

  /**
   * Custom prompts for Contextualiser agent (GraphRAG)
   */
  contextualiser?: ContextualiserPromptsOptions;

  /**
   * Custom prompt for Responder agent
   */
  responder?: string;

  /**
   * Custom prompts for Summariser agent
   */
  summariser?: SummariserPromptsOptions;
}
