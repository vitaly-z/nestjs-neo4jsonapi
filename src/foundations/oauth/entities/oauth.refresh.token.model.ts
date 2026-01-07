import { mapEntity } from "../../../common/abstracts/entity";
import { DataModelInterface } from "../../../common/interfaces/datamodel.interface";
import { EntityFactory } from "../../../core/neo4j/factories/entity.factory";
import { OAuthRefreshToken, oauthRefreshTokenMeta } from "./oauth.refresh.token.entity";

export const mapOAuthRefreshToken = (params: {
  data: any;
  record: any;
  entityFactory: EntityFactory;
}): OAuthRefreshToken => {
  return {
    ...mapEntity({ record: params.data }),
    tokenHash: params.data.tokenHash,
    scope: params.data.scope ?? "",
    expiresAt: params.data.expiresAt ? new Date(params.data.expiresAt) : new Date(),
    isRevoked: params.data.isRevoked ?? false,
    rotationCounter: params.data.rotationCounter ?? 0,
    clientId: params.data.clientId,
    userId: params.data.userId,
    companyId: params.data.companyId ?? null,
    accessTokenId: params.data.accessTokenId ?? null,
  };
};

export const OAuthRefreshTokenModel: DataModelInterface<OAuthRefreshToken> = {
  ...oauthRefreshTokenMeta,
  entity: undefined as unknown as OAuthRefreshToken,
  mapper: mapOAuthRefreshToken,
  serialiser: undefined as any, // Token serializer handles this specially
  singleChildrenTokens: [],
};
