export interface ConfigPromptsInterface {
  graphCreator?: string;
  contextualiser?: {
    questionRefiner?: string;
    rationalPlan?: string;
    keyConceptExtractor?: string;
    atomicFactsExtractor?: string;
    chunk?: string;
    chunkVector?: string;
  };
  responder?: string;
  summariser?: {
    map?: string;
    combine?: string;
    tldr?: string;
  };
}
