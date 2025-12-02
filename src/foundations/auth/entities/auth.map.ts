import { mapEntity } from "../../../common/abstracts/entity";
import { EntityFactory } from "../../../core/neo4j/factories/entity.factory";
import { Auth } from "../../auth/entities/auth.entity";

export const mapAuth = (params: { data: any; record: any; entityFactory: EntityFactory }): Auth => {
  return {
    ...mapEntity({ record: params.data }),
    token: params.data.token,
    expiration: params.data.expiration ? new Date(params.data.expiration) : undefined,
    user: undefined,
  };
};
