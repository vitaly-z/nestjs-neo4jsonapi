import { Entity } from "../../../common/abstracts/entity";
import { User } from "../../user/entities/user.entity";

export type Auth = Entity & {
  token: string;
  expiration: Date;
  user?: User;
};
