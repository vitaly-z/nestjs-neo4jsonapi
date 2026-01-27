import { Injectable } from "@nestjs/common";
import { ClsService } from "nestjs-cls";
import { AbstractRepository } from "../../../core/neo4j/abstracts/abstract.repository";
import { Neo4jService } from "../../../core/neo4j/services/neo4j.service";
import { SecurityService } from "../../../core/security/services/security.service";
import { PendingTwoFactor, PendingTwoFactorDescriptor } from "../entities/pending-two-factor";

@Injectable()
export class PendingTwoFactorRepository extends AbstractRepository<
  PendingTwoFactor,
  typeof PendingTwoFactorDescriptor.relationships
> {
  protected readonly descriptor = PendingTwoFactorDescriptor;

  constructor(neo4j: Neo4jService, securityService: SecurityService, clsService: ClsService) {
    super(neo4j, securityService, clsService);
  }

  async findByUserId(params: { userId: string }): Promise<PendingTwoFactor | null> {
    const { nodeName, labelName } = this.descriptor.model;
    const query = this.neo4j.initQuery({ serialiser: this.descriptor.model });
    query.queryParams = { userId: params.userId };
    query.query = `
      MATCH (user:User {id: $userId})-[:HAS_PENDING_TWO_FACTOR]->(${nodeName}:${labelName})
      RETURN ${nodeName}
    `;
    return this.neo4j.readOne(query);
  }

  async findByIdForUser(params: { pendingId: string }): Promise<PendingTwoFactor | null> {
    const { nodeName, labelName } = this.descriptor.model;
    const query = this.neo4j.initQuery({ serialiser: this.descriptor.model });
    query.queryParams = { pendingId: params.pendingId };
    query.query = `
      MATCH (${nodeName}:${labelName} {id: $pendingId})
      RETURN ${nodeName}
    `;
    return this.neo4j.readOne(query);
  }

  async findByIdWithUser(params: { pendingId: string }): Promise<{ pending: PendingTwoFactor; userId: string } | null> {
    const { nodeName, labelName } = this.descriptor.model;
    const result = await this.neo4j.read(
      `MATCH (user:User)-[:HAS_PENDING_TWO_FACTOR]->(${nodeName}:${labelName} {id: $pendingId})
       RETURN ${nodeName}, user.id as userId`,
      { pendingId: params.pendingId },
    );

    if (result.records.length === 0) return null;

    const record = result.records[0];
    const pendingData = record.get(nodeName).properties;
    const userId = record.get("userId");

    return {
      pending: {
        ...pendingData,
        id: pendingData.id,
        type: this.descriptor.model.type,
        createdAt: pendingData.createdAt ? new Date(pendingData.createdAt) : new Date(),
        updatedAt: pendingData.updatedAt ? new Date(pendingData.updatedAt) : new Date(),
        expiration: pendingData.expiration ? new Date(pendingData.expiration) : new Date(),
        attemptCount: pendingData.attemptCount?.toNumber?.() ?? pendingData.attemptCount ?? 0,
      } as PendingTwoFactor,
      userId,
    };
  }

  /**
   * Creates a new pending two-factor challenge.
   * Automatically deletes any existing pending challenge for the user first.
   */
  async createForUser(params: {
    pendingId: string;
    userId: string;
    challenge: string;
    challengeType: string;
    expiration: Date;
  }): Promise<PendingTwoFactor> {
    // First delete any existing pending for this user
    await this.deleteByUserId({ userId: params.userId });

    const { nodeName, labelName } = this.descriptor.model;
    const query = this.neo4j.initQuery({ serialiser: this.descriptor.model });
    query.queryParams = {
      pendingId: params.pendingId,
      userId: params.userId,
      challenge: params.challenge,
      challengeType: params.challengeType,
      expiration: params.expiration.toISOString(),
    };
    query.query = `
      MATCH (user:User {id: $userId})
      CREATE (${nodeName}:${labelName} {
        id: $pendingId,
        challenge: $challenge,
        challengeType: $challengeType,
        expiration: datetime($expiration),
        attemptCount: 0,
        createdAt: datetime()
      })
      CREATE (user)-[:HAS_PENDING_TWO_FACTOR]->(${nodeName})
      RETURN ${nodeName}
    `;
    return this.neo4j.writeOne(query);
  }

  async incrementAttemptCount(params: { pendingId: string }): Promise<number> {
    const { nodeName, labelName } = this.descriptor.model;
    const query = this.neo4j.initQuery({ serialiser: this.descriptor.model });
    query.queryParams = { pendingId: params.pendingId };
    query.query = `
      MATCH (${nodeName}:${labelName} {id: $pendingId})
      SET ${nodeName}.attemptCount = ${nodeName}.attemptCount + 1
      RETURN ${nodeName}
    `;
    const result = await this.neo4j.writeOne(query);
    return result?.attemptCount ?? 0;
  }

  async deletePending(params: { pendingId: string }): Promise<void> {
    const { nodeName, labelName } = this.descriptor.model;
    const query = this.neo4j.initQuery();
    query.queryParams = { pendingId: params.pendingId };
    query.query = `
      MATCH (${nodeName}:${labelName} {id: $pendingId})
      DETACH DELETE ${nodeName}
    `;
    await this.neo4j.writeOne(query);
  }

  async deleteByUserId(params: { userId: string }): Promise<void> {
    const { nodeName, labelName } = this.descriptor.model;
    const query = this.neo4j.initQuery();
    query.queryParams = { userId: params.userId };
    query.query = `
      MATCH (user:User {id: $userId})-[:HAS_PENDING_TWO_FACTOR]->(${nodeName}:${labelName})
      DETACH DELETE ${nodeName}
    `;
    await this.neo4j.writeOne(query);
  }

  /**
   * Deletes all expired pending two-factor challenges.
   * Returns the count of deleted records.
   */
  async deleteExpired(): Promise<number> {
    const { labelName } = this.descriptor.model;

    // First count expired records
    const countResult = await this.neo4j.read(
      `MATCH (p:${labelName})
       WHERE p.expiration < datetime()
       RETURN count(p) as deletedCount`,
      {},
    );

    const count = countResult.records[0]?.get("deletedCount");
    const deletedCount = count?.toNumber ? count.toNumber() : Number(count) || 0;

    if (deletedCount === 0) return 0;

    // Delete expired records
    const deleteQuery = this.neo4j.initQuery();
    deleteQuery.query = `
      MATCH (p:${labelName})
      WHERE p.expiration < datetime()
      DETACH DELETE p
    `;
    await this.neo4j.writeOne(deleteQuery);

    return deletedCount;
  }
}
