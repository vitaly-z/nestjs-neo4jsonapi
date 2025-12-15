import { Entity } from "../../../common/abstracts/entity";
import { Company } from "../../company";
import { KeyConcept } from "../../keyconcept";

export type Community = Entity & {
  name: string;
  summary: string;
  embedding?: any;
  level: number;
  rating: number;
  memberCount: number;
  isStale: boolean;
  staleSince?: Date;
  lastProcessedAt?: Date;

  company: Company;
  keyconcept: KeyConcept[];
  community: Community;
};
