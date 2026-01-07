import { Injectable } from "@nestjs/common";
import { OAuthClient } from "../entities/oauth.client.entity";
import { oauthClientMeta } from "../entities/oauth.client.meta";

interface SerialiseOptions {
  clientSecret?: string;
}

/**
 * OAuth Client Serialiser
 *
 * Serializes OAuth clients to JSON:API format.
 * Handles relationships and optional secret inclusion.
 */
@Injectable()
export class OAuthClientSerialiser {
  /**
   * Serializes a single OAuth client to JSON:API format.
   *
   * @param client - The OAuth client entity
   * @param options - Serialization options
   * @param options.clientSecret - Optional client secret to include (shown once)
   */
  serialiseOne(client: OAuthClient, options?: SerialiseOptions) {
    const data = this.buildClientData(client, options?.clientSecret);

    return {
      data,
      included: this.buildIncluded(client),
    };
  }

  /**
   * Serializes multiple OAuth clients to JSON:API format.
   */
  serialiseMany(clients: OAuthClient[]) {
    const data = clients.map((client) => this.buildClientData(client));

    // Collect all included resources
    const included: any[] = [];
    for (const client of clients) {
      included.push(...this.buildIncluded(client));
    }

    // Deduplicate included resources
    const uniqueIncluded = this.deduplicateIncluded(included);

    return {
      data,
      included: uniqueIncluded,
    };
  }

  private buildClientData(client: OAuthClient, clientSecret?: string) {
    const attributes: Record<string, any> = {
      clientId: client.clientId,
      name: client.name,
      description: client.description,
      redirectUris: client.redirectUris,
      allowedScopes: client.allowedScopes,
      allowedGrantTypes: client.allowedGrantTypes,
      isConfidential: client.isConfidential,
      isActive: client.isActive,
      accessTokenLifetime: client.accessTokenLifetime,
      refreshTokenLifetime: client.refreshTokenLifetime,
      createdAt: client.createdAt,
      updatedAt: client.updatedAt,
    };

    // Include clientSecret only when explicitly provided (creation/regeneration)
    if (clientSecret) {
      attributes.clientSecret = clientSecret;
    }

    const data: Record<string, any> = {
      type: oauthClientMeta.type,
      id: client.id,
      attributes,
    };

    // Add relationships if present
    const relationships: Record<string, any> = {};

    if (client.owner) {
      relationships.owner = {
        data: { type: "users", id: client.owner.id },
      };
    }

    if (client.company) {
      relationships.company = {
        data: { type: "companies", id: client.company.id },
      };
    }

    if (Object.keys(relationships).length > 0) {
      data.relationships = relationships;
    }

    return data;
  }

  private buildIncluded(client: OAuthClient): any[] {
    const included: any[] = [];

    if (client.owner) {
      included.push({
        type: "users",
        id: client.owner.id,
        attributes: {
          name: client.owner.name,
          email: client.owner.email,
        },
      });
    }

    if (client.company) {
      included.push({
        type: "companies",
        id: client.company.id,
        attributes: {
          name: client.company.name,
        },
      });
    }

    return included;
  }

  private deduplicateIncluded(included: any[]): any[] {
    const seen = new Set<string>();
    return included.filter((item) => {
      const key = `${item.type}:${item.id}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }
}
