import { mapEntity } from "../../../common/abstracts/entity";
import { EntityFactory } from "../../../core/neo4j/factories/entity.factory";
import { AuthCode } from "../../auth/entities/auth.code.entity";

export const mapAuthCode = (params: { data: any; record: any; entityFactory: EntityFactory }): AuthCode => {
  return {
    ...mapEntity({ record: params.data }),
    expiration: params.data.expiration ? new Date(params.data.expiration) : undefined,
    auth: undefined,
  };
};
