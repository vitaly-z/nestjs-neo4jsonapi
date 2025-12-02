import { Entity } from "../../../common/abstracts/entity";
import { Chunk } from "../../chunk/entities/chunk.entity";

export type AtomicFact = Entity & {
  content: string;

  chunk: Chunk;
};
