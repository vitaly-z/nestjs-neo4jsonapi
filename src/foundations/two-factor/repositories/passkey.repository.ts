import { Injectable } from "@nestjs/common";
import { ClsService } from "nestjs-cls";
import { AbstractRepository } from "../../../core/neo4j/abstracts/abstract.repository";
import { Neo4jService } from "../../../core/neo4j/services/neo4j.service";
import { SecurityService } from "../../../core/security/services/security.service";
import { Passkey, PasskeyDescriptor } from "../entities/passkey";

@Injectable()
export class PasskeyRepository extends AbstractRepository<Passkey, typeof PasskeyDescriptor.relationships> {
  protected readonly descriptor = PasskeyDescriptor;

  constructor(neo4j: Neo4jService, securityService: SecurityService, clsService: ClsService) {
    super(neo4j, securityService, clsService);
  }

  async findByUserId(params: { userId: string }): Promise<Passkey[]> {
    const { nodeName, labelName } = this.descriptor.model;
    const query = this.neo4j.initQuery({ serialiser: this.descriptor.model });
    query.queryParams = { userId: params.userId };
    query.query = `
      MATCH (user:User {id: $userId})-[:HAS_PASSKEY]->(${nodeName}:${labelName})
      RETURN ${nodeName}
      ORDER BY ${nodeName}.createdAt DESC
    `;
    return this.neo4j.readMany(query);
  }

  async findByIdForUser(params: { passkeyId: string }): Promise<Passkey | null> {
    const { nodeName, labelName } = this.descriptor.model;
    const query = this.neo4j.initQuery({ serialiser: this.descriptor.model });
    query.queryParams = { passkeyId: params.passkeyId };
    query.query = `
      MATCH (${nodeName}:${labelName} {id: $passkeyId})
      RETURN ${nodeName}
    `;
    return this.neo4j.readOne(query);
  }

  async findByCredentialId(params: { credentialId: string }): Promise<Passkey | null> {
    const { nodeName, labelName } = this.descriptor.model;
    const query = this.neo4j.initQuery({ serialiser: this.descriptor.model });
    query.queryParams = { credentialId: params.credentialId };
    query.query = `
      MATCH (${nodeName}:${labelName} {credentialId: $credentialId})
      RETURN ${nodeName}
    `;
    return this.neo4j.readOne(query);
  }

  /**
   * Returns full data including credentialId and publicKey for WebAuthn operations.
   * Note: Passkey type includes all fields - excludeFromJsonApi only affects API responses.
   */
  async findAllByUserIdWithCredentials(params: { userId: string }): Promise<Passkey[]> {
    const { nodeName, labelName } = this.descriptor.model;
    const query = this.neo4j.initQuery({ serialiser: this.descriptor.model });
    query.queryParams = { userId: params.userId };
    query.query = `
      MATCH (user:User {id: $userId})-[:HAS_PASSKEY]->(${nodeName}:${labelName})
      RETURN ${nodeName}
    `;
    return this.neo4j.readMany(query);
  }

  async createForUser(params: {
    passkeyId: string;
    userId: string;
    name: string;
    credentialId: string;
    publicKey: string;
    counter: number;
    transports: string[];
    backedUp: boolean;
  }): Promise<Passkey> {
    const { nodeName, labelName } = this.descriptor.model;
    const query = this.neo4j.initQuery({ serialiser: this.descriptor.model });
    query.queryParams = {
      passkeyId: params.passkeyId,
      userId: params.userId,
      name: params.name,
      credentialId: params.credentialId,
      publicKey: params.publicKey,
      counter: params.counter,
      transports: JSON.stringify(params.transports),
      backedUp: params.backedUp,
    };
    query.query = `
      MATCH (user:User {id: $userId})
      CREATE (${nodeName}:${labelName} {
        id: $passkeyId,
        name: $name,
        credentialId: $credentialId,
        publicKey: $publicKey,
        counter: $counter,
        transports: $transports,
        backedUp: $backedUp,
        createdAt: datetime(),
        updatedAt: datetime()
      })
      CREATE (user)-[:HAS_PASSKEY]->(${nodeName})
      RETURN ${nodeName}
    `;
    return this.neo4j.writeOne(query);
  }

  async updatePasskey(params: {
    passkeyId: string;
    name?: string;
    counter?: number;
    lastUsedAt?: Date;
  }): Promise<Passkey> {
    const { nodeName, labelName } = this.descriptor.model;
    const query = this.neo4j.initQuery({ serialiser: this.descriptor.model });
    const setClauses: string[] = [`${nodeName}.updatedAt = datetime()`];
    query.queryParams = { passkeyId: params.passkeyId };

    if (params.name !== undefined) {
      setClauses.push(`${nodeName}.name = $name`);
      query.queryParams.name = params.name;
    }
    if (params.counter !== undefined) {
      setClauses.push(`${nodeName}.counter = $counter`);
      query.queryParams.counter = params.counter;
    }
    if (params.lastUsedAt !== undefined) {
      setClauses.push(`${nodeName}.lastUsedAt = datetime($lastUsedAt)`);
      query.queryParams.lastUsedAt = params.lastUsedAt.toISOString();
    }

    query.query = `
      MATCH (${nodeName}:${labelName} {id: $passkeyId})
      SET ${setClauses.join(", ")}
      RETURN ${nodeName}
    `;
    return this.neo4j.writeOne(query);
  }

  async deletePasskey(params: { passkeyId: string }): Promise<void> {
    const { nodeName, labelName } = this.descriptor.model;
    const query = this.neo4j.initQuery();
    query.queryParams = { passkeyId: params.passkeyId };
    query.query = `
      MATCH (${nodeName}:${labelName} {id: $passkeyId})
      DETACH DELETE ${nodeName}
    `;
    await this.neo4j.writeOne(query);
  }

  async deleteAllByUserId(params: { userId: string }): Promise<void> {
    const { nodeName, labelName } = this.descriptor.model;
    const query = this.neo4j.initQuery();
    query.queryParams = { userId: params.userId };
    query.query = `
      MATCH (user:User {id: $userId})-[:HAS_PASSKEY]->(${nodeName}:${labelName})
      DETACH DELETE ${nodeName}
    `;
    await this.neo4j.writeOne(query);
  }

  async countByUserId(params: { userId: string }): Promise<number> {
    const { labelName } = this.descriptor.model;
    const result = await this.neo4j.read(
      `MATCH (user:User {id: $userId})-[:HAS_PASSKEY]->(passkey:${labelName})
       RETURN count(passkey) as count`,
      { userId: params.userId },
    );

    if (result.records.length === 0) return 0;
    const count = result.records[0].get("count");
    return count?.toNumber ? count.toNumber() : Number(count) || 0;
  }
}
