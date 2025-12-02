import { Entity } from "../../../common/abstracts/entity";
import { User } from "../../user/entities/user.entity";

export type Content = Entity & {
  name: string;
  contentType: string;
  abstract?: string;
  tldr?: string;
  aiStatus?: string;

  relevance?: number;

  owner: User;
};
