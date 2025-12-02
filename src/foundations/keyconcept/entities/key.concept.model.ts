import { DataModelInterface } from "../../../common/interfaces/datamodel.interface";
import { atomicFactMeta } from "../../atomicfact/entities/atomic.fact.meta";
import { KeyConcept } from "../../keyconcept/entities/key.concept.entity";
import { mapKeyConcept } from "../../keyconcept/entities/key.concept.map";
import { keyConceptMeta } from "../../keyconcept/entities/key.concept.meta";

export const KeyConceptModel: DataModelInterface<KeyConcept> = {
  ...keyConceptMeta,
  entity: undefined as unknown as KeyConcept,
  mapper: mapKeyConcept,
  childrenTokens: [],
  singleChildrenTokens: [atomicFactMeta.nodeName],
};
