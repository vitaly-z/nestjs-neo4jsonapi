import { Entity } from "../../../common/abstracts/entity";

export type Chunk = Entity & {
  content: string;
  position?: number;
  relevance?: number;
  imagePath?: string;
  nodeId?: string;
  nodeType: string;
  aiStatus?: string;
  reason?: string;
};
