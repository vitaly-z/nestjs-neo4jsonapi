import { mapEntity } from "../../../common/abstracts/entity";
import { EntityFactory } from "../../../core/neo4j/factories/entity.factory";
import { Content } from "../../content/entities/content.entity";

export const mapContent = (params: { data: any; record: any; entityFactory: EntityFactory }): Content => {
  return {
    ...mapEntity({ record: params.data }),
    name: params.data.name,
    contentType: params.data.labels[0],
    abstract: params.data.abstract,
    tldr: params.data.tldr,
    aiStatus: params.data.aiStatus,

    relevance: params.record.has("totalScore") ? Number(params.record.get("totalScore")) : 0,

    owner: undefined,
    author: undefined,
  };
};
