import { mapEntity } from "../../../common/abstracts/entity";
import { EntityFactory } from "../../../core/neo4j/factories/entity.factory";
import { AtomicFact } from "../../atomicfact/entities/atomic.fact.entity";

export const mapAtomicFact = (params: { data: any; record: any; entityFactory: EntityFactory }): AtomicFact => {
  return {
    ...mapEntity({ record: params.data }),
    content: params.data.content,
    chunk: undefined,
  };
};
