import { Injectable } from "@nestjs/common";
import { ClsService } from "nestjs-cls";
import { AbstractRepository } from "../../../core/neo4j/abstracts/abstract.repository";
import { Neo4jService } from "../../../core/neo4j/services/neo4j.service";
import { SecurityService } from "../../../core/security/services/security.service";
import { BackupCode, BackupCodeDescriptor } from "../entities/backup-code";

@Injectable()
export class BackupCodeRepository extends AbstractRepository<BackupCode, typeof BackupCodeDescriptor.relationships> {
  protected readonly descriptor = BackupCodeDescriptor;

  constructor(neo4j: Neo4jService, securityService: SecurityService, clsService: ClsService) {
    super(neo4j, securityService, clsService);
  }

  async findByUserId(params: { userId: string }): Promise<BackupCode[]> {
    const { nodeName, labelName } = this.descriptor.model;
    const query = this.neo4j.initQuery({ serialiser: this.descriptor.model });
    query.queryParams = { userId: params.userId };
    query.query = `
      MATCH (user:User {id: $userId})-[:HAS_BACKUP_CODE]->(${nodeName}:${labelName})
      RETURN ${nodeName}
      ORDER BY ${nodeName}.createdAt
    `;
    return this.neo4j.readMany(query);
  }

  /**
   * Returns all backup codes with their hashes for internal verification.
   * Note: BackupCode type includes codeHash - excludeFromJsonApi only affects API responses.
   */
  async findUnusedByUserId(params: { userId: string }): Promise<BackupCode[]> {
    const { nodeName, labelName } = this.descriptor.model;
    const query = this.neo4j.initQuery({ serialiser: this.descriptor.model });
    query.queryParams = { userId: params.userId };
    query.query = `
      MATCH (user:User {id: $userId})-[:HAS_BACKUP_CODE]->(${nodeName}:${labelName})
      WHERE ${nodeName}.usedAt IS NULL
      RETURN ${nodeName}
    `;
    return this.neo4j.readMany(query);
  }

  async findUnusedCount(params: { userId: string }): Promise<number> {
    const { labelName } = this.descriptor.model;
    const result = await this.neo4j.read(
      `MATCH (user:User {id: $userId})-[:HAS_BACKUP_CODE]->(backupcode:${labelName})
       WHERE backupcode.usedAt IS NULL
       RETURN count(backupcode) as count`,
      { userId: params.userId },
    );

    if (result.records.length === 0) return 0;
    const count = result.records[0].get("count");
    return count?.toNumber ? count.toNumber() : Number(count) || 0;
  }

  async createForUser(params: { codeId: string; userId: string; codeHash: string }): Promise<BackupCode> {
    const { nodeName, labelName } = this.descriptor.model;
    const query = this.neo4j.initQuery({ serialiser: this.descriptor.model });
    query.queryParams = {
      codeId: params.codeId,
      userId: params.userId,
      codeHash: params.codeHash,
    };
    query.query = `
      MATCH (user:User {id: $userId})
      CREATE (${nodeName}:${labelName} {
        id: $codeId,
        codeHash: $codeHash,
        createdAt: datetime()
      })
      CREATE (user)-[:HAS_BACKUP_CODE]->(${nodeName})
      RETURN ${nodeName}
    `;
    return this.neo4j.writeOne(query);
  }

  async markUsed(params: { codeId: string }): Promise<BackupCode> {
    const { nodeName, labelName } = this.descriptor.model;
    const query = this.neo4j.initQuery({ serialiser: this.descriptor.model });
    query.queryParams = { codeId: params.codeId };
    query.query = `
      MATCH (${nodeName}:${labelName} {id: $codeId})
      SET ${nodeName}.usedAt = datetime()
      RETURN ${nodeName}
    `;
    return this.neo4j.writeOne(query);
  }

  async deleteAllByUserId(params: { userId: string }): Promise<void> {
    const { nodeName, labelName } = this.descriptor.model;
    const query = this.neo4j.initQuery();
    query.queryParams = { userId: params.userId };
    query.query = `
      MATCH (user:User {id: $userId})-[:HAS_BACKUP_CODE]->(${nodeName}:${labelName})
      DETACH DELETE ${nodeName}
    `;
    await this.neo4j.writeOne(query);
  }
}
