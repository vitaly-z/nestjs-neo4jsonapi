import { Entity } from "../../../common/abstracts/entity";
import { Feature } from "../../feature/entities/feature.entity";

export type Role = Entity & {
  name: string;
  description?: string;

  isSelectable?: boolean;

  requiredFeature?: Feature;
};
