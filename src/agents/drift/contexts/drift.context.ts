import { Annotation } from "@langchain/langgraph";
import { TokenUsageContext } from "../../../common/contexts/tokenusage.context";
import { Community } from "../../../foundations/community/entities/community.entity";

export interface FollowUpAnswer {
  question: string;
  answer: string;
  depth: number;
  additionalQuestions: string[];
  shouldContinue: boolean;
}

export const DriftContext = Annotation.Root({
  // Input
  question: Annotation<string>,
  topK: Annotation<number>({
    default: () => 5,
    reducer: (current, update) => update ?? current,
  }),
  maxDepth: Annotation<number>({
    default: () => 2,
    reducer: (current, update) => update ?? current,
  }),

  // Workflow control
  nextStep: Annotation<string>({
    default: () => "hyde",
    reducer: (current, update) => update || current,
  }),
  hops: Annotation<number>({
    default: () => 0,
    reducer: (current, update) => (current ?? 0) + (update ?? 0),
  }),

  // HyDE phase
  hypotheticalAnswer: Annotation<string>({
    default: () => "",
    reducer: (current, update) => update || current,
  }),
  hydeEmbedding: Annotation<number[]>({
    default: () => [],
    reducer: (current, update) => (update && update.length > 0 ? update : current),
  }),

  // Community search phase
  matchedCommunities: Annotation<Community[]>({
    default: () => [],
    reducer: (current, update) => (update && update.length > 0 ? update : current),
  }),
  communitySummaries: Annotation<string>({
    default: () => "",
    reducer: (current, update) => update || current,
  }),

  // Primer answer phase
  initialAnswer: Annotation<string>({
    default: () => "",
    reducer: (current, update) => update || current,
  }),
  followUpQuestions: Annotation<string[]>({
    default: () => [],
    reducer: (current, update) => (update && update.length > 0 ? update : current),
  }),
  confidence: Annotation<number>({
    default: () => 0,
    reducer: (current, update) => update ?? current,
  }),

  // Follow-up phase
  currentFollowUpIndex: Annotation<number>({
    default: () => 0,
    reducer: (current, update) => update ?? current,
  }),
  currentDepth: Annotation<number>({
    default: () => 0,
    reducer: (current, update) => update ?? current,
  }),
  followUpAnswers: Annotation<FollowUpAnswer[]>({
    default: () => [],
    reducer: (current, update) => [...(current ?? []), ...(update ?? [])],
  }),
  priorContext: Annotation<string>({
    default: () => "",
    reducer: (current, update) => update || current,
  }),

  // Synthesis phase
  finalAnswer: Annotation<string>({
    default: () => "",
    reducer: (current, update) => update || current,
  }),

  // Token tracking
  tokens: Annotation<typeof TokenUsageContext.State>({
    default: () => ({ input: 0, output: 0 }),
    reducer: (current, update) => {
      if (!update) return current;
      return {
        input: (current?.input || 0) + (update?.input || 0),
        output: (current?.output || 0) + (update?.output || 0),
      };
    },
  }),
});

export type DriftContextState = typeof DriftContext.State;
