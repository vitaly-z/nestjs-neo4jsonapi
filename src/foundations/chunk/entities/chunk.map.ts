import { mapEntity } from "../../../common/abstracts/entity";
import { EntityFactory } from "../../../core/neo4j/factories/entity.factory";
import { Chunk } from "../../chunk/entities/chunk.entity";

export const mapChunk = (params: { data: any; record: any; entityFactory: EntityFactory }): Chunk => {
  const reason: string | undefined = undefined;
  const relevance: number | undefined = undefined;

  // for (const key of params.record.keys) {
  //   if (key.endsWith(`${messageMeta.nodeName}_${chunkMeta.nodeName}_relationship`)) {
  //     const rel = params.record.get(key);
  //     if (rel?.type === "REFERENCES_CHUNK") {
  //       if (rel?.properties?.reason != null) reason = rel.properties.reason;
  //       if (rel?.properties?.relevance != null) relevance = rel.properties.relevance;
  //     }
  //   }
  // }

  return {
    ...mapEntity({ record: params.data }),
    content: params.data.content,
    position: params.data.position ?? 0,
    // relevance: params.data.relevance ?? 0,
    imagePath: params.data.imagePath ?? "",
    nodeId: params.data.nodeId,
    nodeType: params.data.nodeType,
    aiStatus: params.data.aiStatus,
    reason: reason,
    relevance: relevance,
  };
};
