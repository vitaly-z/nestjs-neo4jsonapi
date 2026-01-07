import { Entity } from "../../../common/abstracts/entity";
import { DataMeta } from "../../../common/interfaces/datamodel.interface";

/**
 * OAuth Refresh Token Entity
 *
 * Represents an issued refresh token. Only the hash is stored.
 * Supports token rotation via rotationCounter.
 */
export type OAuthRefreshToken = Entity & {
  /** SHA256 hash of the refresh token */
  tokenHash: string;

  /** Space-separated scope string */
  scope: string;

  /** When this token expires */
  expiresAt: Date;

  /** Whether this token has been revoked */
  isRevoked: boolean;

  /** Rotation counter - incremented each time token is rotated */
  rotationCounter: number;

  /** Client ID this token was issued to */
  clientId: string;

  /** User ID this token represents */
  userId: string;

  /** Company ID associated with this token */
  companyId: string | null;

  /** ID of the associated access token */
  accessTokenId: string | null;
};

export const oauthRefreshTokenMeta: DataMeta = {
  type: "oauth-refresh-tokens",
  endpoint: "oauth/refresh-tokens",
  nodeName: "oauthrefreshtoken",
  labelName: "OAuthRefreshToken",
};
