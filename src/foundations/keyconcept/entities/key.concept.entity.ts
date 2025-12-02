import { Entity } from "../../../common/abstracts/entity";
import { AtomicFact } from "../../atomicfact/entities/atomic.fact.entity";

export type KeyConcept = Entity & {
  value: string;
  embedding?: any;

  atomicfact: AtomicFact;
};
