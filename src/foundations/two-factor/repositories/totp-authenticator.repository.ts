import { Injectable } from "@nestjs/common";
import { ClsService } from "nestjs-cls";
import { AbstractRepository } from "../../../core/neo4j/abstracts/abstract.repository";
import { Neo4jService } from "../../../core/neo4j/services/neo4j.service";
import { SecurityService } from "../../../core/security/services/security.service";
import { TotpAuthenticator, TotpAuthenticatorDescriptor } from "../entities/totp-authenticator";

@Injectable()
export class TotpAuthenticatorRepository extends AbstractRepository<
  TotpAuthenticator,
  typeof TotpAuthenticatorDescriptor.relationships
> {
  protected readonly descriptor = TotpAuthenticatorDescriptor;

  constructor(neo4j: Neo4jService, securityService: SecurityService, clsService: ClsService) {
    super(neo4j, securityService, clsService);
  }

  async findVerifiedByUserId(params: { userId: string }): Promise<TotpAuthenticator[]> {
    const { nodeName, labelName } = this.descriptor.model;
    const query = this.neo4j.initQuery({ serialiser: this.descriptor.model });
    query.queryParams = { userId: params.userId };
    query.query = `
      MATCH (user:User {id: $userId})-[:HAS_TOTP_AUTHENTICATOR]->(${nodeName}:${labelName})
      WHERE ${nodeName}.verified = true
      RETURN ${nodeName}
      ORDER BY ${nodeName}.createdAt DESC
    `;
    return this.neo4j.readMany(query);
  }

  async findByIdForUser(params: { authenticatorId: string }): Promise<TotpAuthenticator | null> {
    const { nodeName, labelName } = this.descriptor.model;
    const query = this.neo4j.initQuery({ serialiser: this.descriptor.model });
    query.queryParams = { authenticatorId: params.authenticatorId };
    query.query = `
      MATCH (${nodeName}:${labelName} {id: $authenticatorId})
      RETURN ${nodeName}
    `;
    return this.neo4j.readOne(query);
  }

  /**
   * Returns authenticator with secret for internal TOTP validation.
   * Note: TotpAuthenticator type includes secret - excludeFromJsonApi only affects API responses.
   */
  async findByIdWithSecret(params: { authenticatorId: string }): Promise<TotpAuthenticator | null> {
    const { nodeName, labelName } = this.descriptor.model;
    const query = this.neo4j.initQuery({ serialiser: this.descriptor.model });
    query.queryParams = { authenticatorId: params.authenticatorId };
    query.query = `
      MATCH (${nodeName}:${labelName} {id: $authenticatorId})
      RETURN ${nodeName}
    `;
    return this.neo4j.readOne(query);
  }

  /**
   * Returns all verified authenticators with secrets for internal TOTP validation.
   * Note: TotpAuthenticator type includes secret - excludeFromJsonApi only affects API responses.
   */
  async findAllByUserIdWithSecrets(params: { userId: string }): Promise<TotpAuthenticator[]> {
    const { nodeName, labelName } = this.descriptor.model;
    const query = this.neo4j.initQuery({ serialiser: this.descriptor.model });
    query.queryParams = { userId: params.userId };
    query.query = `
      MATCH (user:User {id: $userId})-[:HAS_TOTP_AUTHENTICATOR]->(${nodeName}:${labelName})
      WHERE ${nodeName}.verified = true
      RETURN ${nodeName}
    `;
    return this.neo4j.readMany(query);
  }

  async createForUser(params: {
    authenticatorId: string;
    userId: string;
    name: string;
    secret: string;
    verified?: boolean;
  }): Promise<TotpAuthenticator> {
    const { nodeName, labelName } = this.descriptor.model;
    const query = this.neo4j.initQuery({ serialiser: this.descriptor.model });
    query.queryParams = {
      authenticatorId: params.authenticatorId,
      userId: params.userId,
      name: params.name,
      secret: params.secret,
      verified: params.verified ?? false,
    };
    query.query = `
      MATCH (user:User {id: $userId})
      CREATE (${nodeName}:${labelName} {
        id: $authenticatorId,
        name: $name,
        secret: $secret,
        verified: $verified,
        createdAt: datetime(),
        updatedAt: datetime()
      })
      CREATE (user)-[:HAS_TOTP_AUTHENTICATOR]->(${nodeName})
      RETURN ${nodeName}
    `;
    return this.neo4j.writeOne(query);
  }

  async updateAuthenticator(params: {
    authenticatorId: string;
    verified?: boolean;
    lastUsedAt?: Date;
  }): Promise<TotpAuthenticator> {
    const { nodeName, labelName } = this.descriptor.model;
    const query = this.neo4j.initQuery({ serialiser: this.descriptor.model });
    const setClauses: string[] = [`${nodeName}.updatedAt = datetime()`];
    query.queryParams = { authenticatorId: params.authenticatorId };

    if (params.verified !== undefined) {
      setClauses.push(`${nodeName}.verified = $verified`);
      query.queryParams.verified = params.verified;
    }
    if (params.lastUsedAt !== undefined) {
      setClauses.push(`${nodeName}.lastUsedAt = datetime($lastUsedAt)`);
      query.queryParams.lastUsedAt = params.lastUsedAt.toISOString();
    }

    query.query = `
      MATCH (${nodeName}:${labelName} {id: $authenticatorId})
      SET ${setClauses.join(", ")}
      RETURN ${nodeName}
    `;
    return this.neo4j.writeOne(query);
  }

  async deleteAuthenticator(params: { authenticatorId: string }): Promise<void> {
    const { nodeName, labelName } = this.descriptor.model;
    const query = this.neo4j.initQuery();
    query.queryParams = { authenticatorId: params.authenticatorId };
    query.query = `
      MATCH (${nodeName}:${labelName} {id: $authenticatorId})
      DETACH DELETE ${nodeName}
    `;
    await this.neo4j.writeOne(query);
  }

  async deleteAllByUserId(params: { userId: string }): Promise<void> {
    const { nodeName, labelName } = this.descriptor.model;
    const query = this.neo4j.initQuery();
    query.queryParams = { userId: params.userId };
    query.query = `
      MATCH (user:User {id: $userId})-[:HAS_TOTP_AUTHENTICATOR]->(${nodeName}:${labelName})
      DETACH DELETE ${nodeName}
    `;
    await this.neo4j.writeOne(query);
  }

  async countVerifiedByUserId(params: { userId: string }): Promise<number> {
    const { labelName } = this.descriptor.model;
    const result = await this.neo4j.read(
      `MATCH (user:User {id: $userId})-[:HAS_TOTP_AUTHENTICATOR]->(t:${labelName})
       WHERE t.verified = true
       RETURN count(t) as count`,
      { userId: params.userId },
    );

    if (result.records.length === 0) return 0;
    const count = result.records[0].get("count");
    return count?.toNumber ? count.toNumber() : Number(count) || 0;
  }
}
