import { LLMKeyConcept } from "../../llm/types/llm.keyconcept";

export type LLMAtomicFact = {
  content: string;
  keyConcepts: LLMKeyConcept[];
};
