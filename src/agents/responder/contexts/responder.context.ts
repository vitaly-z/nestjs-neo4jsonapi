import { Annotation } from "@langchain/langgraph";
import { ContextualiserContext } from "../../contextualiser/contexts/contextualiser.context";
import { DriftSearchResult } from "../../drift/services/drift.search.service";
import { ResponderAnswerContext } from "../../responder/contexts/responder.answer.context";
import { TokenUsageContext } from "../../../common/contexts/tokenusage.context";
import { DataLimits } from "../../../common/types/data.limits";

export const ResponderContext = Annotation.Root({
  companyId: Annotation<string>,
  contentId: Annotation<string>,
  contentType: Annotation<string>,
  dataLimits: Annotation<DataLimits>(),
  useDrift: Annotation<boolean>({
    default: () => false,
    reducer: (current, update) => update ?? current,
  }),
  context: Annotation<typeof ContextualiserContext.State>({
    default: () => undefined,
    reducer: (current, update) => (current === undefined ? update : current),
  }),
  driftContext: Annotation<DriftSearchResult>({
    default: () => undefined,
    reducer: (current, update) => (current === undefined ? update : current),
  }),
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
  finalAnswer: Annotation<typeof ResponderAnswerContext.State>({
    default: () => undefined,
    reducer: (current, update) => (current === undefined ? update : current),
  }),
  sources: Annotation<{ chunkId: string; relevance: number; reason: string }[]>,
  ontologies: Annotation<string[]>,
});

export type ResponderContextState = typeof ResponderContext.State;
