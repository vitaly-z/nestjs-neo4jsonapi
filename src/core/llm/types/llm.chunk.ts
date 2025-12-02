import { LLMAtomicFact } from "../../llm/types/llm.atomicfact";

export type LLMChunk = {
  id: string;
  content: string;
  imagePath?: string;
  atomicFacts: LLMAtomicFact[];
};
