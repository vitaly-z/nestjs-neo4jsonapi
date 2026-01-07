import { mapEntity } from "../../../common/abstracts/entity";
import { DataModelInterface } from "../../../common/interfaces/datamodel.interface";
import { EntityFactory } from "../../../core/neo4j/factories/entity.factory";
import { OAuthAccessToken, oauthAccessTokenMeta } from "./oauth.access.token.entity";

export const mapOAuthAccessToken = (params: {
  data: any;
  record: any;
  entityFactory: EntityFactory;
}): OAuthAccessToken => {
  return {
    ...mapEntity({ record: params.data }),
    tokenHash: params.data.tokenHash,
    scope: params.data.scope ?? "",
    expiresAt: params.data.expiresAt ? new Date(params.data.expiresAt) : new Date(),
    isRevoked: params.data.isRevoked ?? false,
    grantType: params.data.grantType,
    clientId: params.data.clientId,
    userId: params.data.userId ?? null,
    companyId: params.data.companyId ?? null,
  };
};

export const OAuthAccessTokenModel: DataModelInterface<OAuthAccessToken> = {
  ...oauthAccessTokenMeta,
  entity: undefined as unknown as OAuthAccessToken,
  mapper: mapOAuthAccessToken,
  serialiser: undefined as any, // Token serializer handles this specially
  singleChildrenTokens: [],
};
