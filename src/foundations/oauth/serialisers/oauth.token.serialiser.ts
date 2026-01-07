import { Injectable } from "@nestjs/common";

/**
 * OAuth Token Response (RFC 6749 Section 5.1)
 */
export interface TokenResponse {
  access_token: string;
  token_type: "Bearer";
  expires_in: number;
  refresh_token?: string;
  scope?: string;
}

/**
 * OAuth Introspection Response (RFC 7662 Section 2.2)
 */
export interface IntrospectResponse {
  active: boolean;
  scope?: string;
  client_id?: string;
  username?: string;
  token_type?: string;
  exp?: number;
  iat?: number;
  sub?: string;
  aud?: string;
  iss?: string;
}

/**
 * OAuth Error Response (RFC 6749 Section 5.2)
 */
export interface ErrorResponse {
  error: string;
  error_description?: string;
  error_uri?: string;
}

/**
 * OAuth Token Serialiser
 *
 * Serializes OAuth token responses per RFC 6749.
 * Note: These are NOT JSON:API format - they follow OAuth RFC formats.
 */
@Injectable()
export class OAuthTokenSerialiser {
  /**
   * Serializes an access token response.
   */
  serialiseTokenResponse(params: {
    accessToken: string;
    expiresIn: number;
    refreshToken?: string;
    scope?: string;
  }): TokenResponse {
    const response: TokenResponse = {
      access_token: params.accessToken,
      token_type: "Bearer",
      expires_in: params.expiresIn,
    };

    if (params.refreshToken) {
      response.refresh_token = params.refreshToken;
    }

    if (params.scope) {
      response.scope = params.scope;
    }

    return response;
  }

  /**
   * Serializes a token introspection response.
   */
  serialiseIntrospectResponse(params: {
    active: boolean;
    scope?: string;
    clientId?: string;
    username?: string;
    tokenType?: string;
    exp?: number;
    iat?: number;
    sub?: string;
    aud?: string;
    iss?: string;
  }): IntrospectResponse {
    if (!params.active) {
      return { active: false };
    }

    const response: IntrospectResponse = {
      active: true,
    };

    if (params.scope) response.scope = params.scope;
    if (params.clientId) response.client_id = params.clientId;
    if (params.username) response.username = params.username;
    if (params.tokenType) response.token_type = params.tokenType;
    if (params.exp) response.exp = params.exp;
    if (params.iat) response.iat = params.iat;
    if (params.sub) response.sub = params.sub;
    if (params.aud) response.aud = params.aud;
    if (params.iss) response.iss = params.iss;

    return response;
  }

  /**
   * Serializes an OAuth error response.
   */
  serialiseErrorResponse(error: string, errorDescription?: string, errorUri?: string): ErrorResponse {
    const response: ErrorResponse = { error };

    if (errorDescription) {
      response.error_description = errorDescription;
    }

    if (errorUri) {
      response.error_uri = errorUri;
    }

    return response;
  }
}
