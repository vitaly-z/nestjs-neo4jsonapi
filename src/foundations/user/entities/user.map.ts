import { mapEntity } from "../../../common/abstracts/entity";
import { EntityFactory } from "../../../core/neo4j/factories/entity.factory";
import { User } from "../../user/entities/user.entity";

export const mapUser = (params: { data: any; record: any; entityFactory: EntityFactory }): User => {
  return {
    ...mapEntity({ record: params.data }),
    email: params.data.email,
    name: params.data.name,
    title: params.data.title,
    bio: params.data.bio,
    password: params.data.password,
    avatar: params.data.avatar,
    phone: params.data.phone,
    rate: params.data.rate,
    isActive: params.data.isActive,
    isDeleted: params.data.isDeleted,
    lastLogin: params.data.lastLogin ? new Date(params.data.lastLogin) : undefined,
    code: params.data.code,
    codeExpiration: params.data.codeExpiration ? new Date(params.data.codeExpiration) : undefined,
    role: [],
    module: [],
    company: undefined,
  };
};
