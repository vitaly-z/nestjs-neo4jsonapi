import { mapEntity } from "../../../common/abstracts/entity";
import { EntityFactory } from "../../../core/neo4j/factories/entity.factory";
import { OAuthClient } from "./oauth.client.entity";

export const mapOAuthClient = (params: { data: any; record: any; entityFactory: EntityFactory }): OAuthClient => {
  return {
    ...mapEntity({ record: params.data }),
    clientId: params.data.clientId,
    clientSecretHash: params.data.clientSecretHash ?? null,
    name: params.data.name,
    description: params.data.description ?? null,
    redirectUris: params.data.redirectUris ? JSON.parse(params.data.redirectUris) : [],
    allowedScopes: params.data.allowedScopes ? JSON.parse(params.data.allowedScopes) : [],
    allowedGrantTypes: params.data.allowedGrantTypes ? JSON.parse(params.data.allowedGrantTypes) : [],
    isConfidential: params.data.isConfidential ?? true,
    isActive: params.data.isActive ?? true,
    accessTokenLifetime: params.data.accessTokenLifetime ?? 3600,
    refreshTokenLifetime: params.data.refreshTokenLifetime ?? 604800,
    owner: undefined,
    company: undefined,
  };
};
