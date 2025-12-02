import { TokenUsageInterface } from "../../../common/interfaces/token.usage.interface";

export interface ChunkAnalysisInterface {
  atomicFacts: {
    content: string;
    keyConcepts: string[];
  }[];
  keyConceptsRelationships: {
    keyConcept1: string;
    keyConcept2: string;
    relationship: string;
  }[];
  tokens: TokenUsageInterface;
}
