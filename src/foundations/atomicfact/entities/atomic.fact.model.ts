import { DataModelInterface } from "../../../common/interfaces/datamodel.interface";
import { AtomicFact } from "../../atomicfact/entities/atomic.fact.entity";
import { mapAtomicFact } from "../../atomicfact/entities/atomic.fact.map";
import { atomicFactMeta } from "../../atomicfact/entities/atomic.fact.meta";
import { chunkMeta } from "../../chunk/entities/chunk.meta";

export const AtomicFactModel: DataModelInterface<AtomicFact> = {
  ...atomicFactMeta,
  entity: undefined as unknown as AtomicFact,
  mapper: mapAtomicFact,
  singleChildrenTokens: [chunkMeta.nodeName],
};
