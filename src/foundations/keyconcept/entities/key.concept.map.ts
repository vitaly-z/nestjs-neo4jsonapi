import { mapEntity } from "../../../common/abstracts/entity";
import { EntityFactory } from "../../../core/neo4j/factories/entity.factory";
import { KeyConcept } from "../../keyconcept/entities/key.concept.entity";

export const mapKeyConcept = (params: { data: any; record: any; entityFactory: EntityFactory }): KeyConcept => {
  return {
    ...mapEntity({ record: params.data }),
    value: params.data.value,
    description: params.data.description,
    embedding: params.data.embedding,
    atomicfact: undefined,
  };
};
