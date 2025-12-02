import { Entity } from "../../../common/abstracts/entity";
import { Auth } from "../../auth/entities/auth.entity";

export type AuthCode = Entity & {
  expiration: Date;

  auth?: Auth;
};
