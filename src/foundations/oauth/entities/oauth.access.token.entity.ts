import { Entity } from "../../../common/abstracts/entity";
import { DataMeta } from "../../../common/interfaces/datamodel.interface";

/**
 * OAuth Access Token Entity
 *
 * Represents an issued access token. Only the hash is stored.
 * The actual token is returned to the client and never stored.
 */
export type OAuthAccessToken = Entity & {
  /** SHA256 hash of the access token */
  tokenHash: string;

  /** Space-separated scope string */
  scope: string;

  /** When this token expires */
  expiresAt: Date;

  /** Whether this token has been revoked */
  isRevoked: boolean;

  /** How this token was obtained (authorization_code, client_credentials, refresh_token) */
  grantType: string;

  /** Client ID this token was issued to */
  clientId: string;

  /** User ID this token represents (null for client_credentials) */
  userId: string | null;

  /** Company ID associated with this token */
  companyId: string | null;
};

export const oauthAccessTokenMeta: DataMeta = {
  type: "oauth-access-tokens",
  endpoint: "oauth/access-tokens",
  nodeName: "oauthaccesstoken",
  labelName: "OAuthAccessToken",
};
