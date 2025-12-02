import { DataModelInterface } from "../../../common/interfaces/datamodel.interface";
import { Chunk } from "../../chunk/entities/chunk.entity";
import { mapChunk } from "../../chunk/entities/chunk.map";
import { chunkMeta } from "../../chunk/entities/chunk.meta";
import { ChunkSerialiser } from "../../chunk/serialisers/chunk.serialiser";

export const ChunkModel: DataModelInterface<Chunk> = {
  ...chunkMeta,
  entity: undefined as unknown as Chunk,
  mapper: mapChunk,
  serialiser: ChunkSerialiser,
};
