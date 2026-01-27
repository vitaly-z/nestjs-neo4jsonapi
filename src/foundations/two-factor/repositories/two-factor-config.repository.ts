import { Injectable } from "@nestjs/common";
import { ClsService } from "nestjs-cls";
import { AbstractRepository } from "../../../core/neo4j/abstracts/abstract.repository";
import { Neo4jService } from "../../../core/neo4j/services/neo4j.service";
import { SecurityService } from "../../../core/security/services/security.service";
import { TwoFactorConfig, TwoFactorConfigDescriptor } from "../entities/two-factor-config";

@Injectable()
export class TwoFactorConfigRepository extends AbstractRepository<
  TwoFactorConfig,
  typeof TwoFactorConfigDescriptor.relationships
> {
  protected readonly descriptor = TwoFactorConfigDescriptor;

  constructor(neo4j: Neo4jService, securityService: SecurityService, clsService: ClsService) {
    super(neo4j, securityService, clsService);
  }

  // onModuleInit is inherited from AbstractRepository - auto-creates constraints

  async findByUserId(params: { userId: string }): Promise<TwoFactorConfig | null> {
    const { nodeName, labelName } = this.descriptor.model;
    const query = this.neo4j.initQuery({ serialiser: this.descriptor.model });
    query.queryParams = { userId: params.userId };
    query.query = `
      MATCH (user:User {id: $userId})-[:HAS_TWO_FACTOR_CONFIG]->(${nodeName}:${labelName})
      RETURN ${nodeName}
    `;
    return this.neo4j.readOne(query);
  }

  async createForUser(params: {
    configId: string;
    userId: string;
    isEnabled?: boolean;
    preferredMethod?: string;
  }): Promise<TwoFactorConfig> {
    const { nodeName, labelName } = this.descriptor.model;
    const query = this.neo4j.initQuery({ serialiser: this.descriptor.model });
    query.queryParams = {
      configId: params.configId,
      userId: params.userId,
      isEnabled: params.isEnabled ?? false,
      preferredMethod: params.preferredMethod ?? "totp",
    };
    query.query = `
      MATCH (user:User {id: $userId})
      CREATE (${nodeName}:${labelName} {
        id: $configId,
        isEnabled: $isEnabled,
        preferredMethod: $preferredMethod,
        backupCodesCount: 0,
        createdAt: datetime(),
        updatedAt: datetime()
      })
      CREATE (user)-[:HAS_TWO_FACTOR_CONFIG]->(${nodeName})
      RETURN ${nodeName}
    `;
    return this.neo4j.writeOne(query);
  }

  async updateByUserId(params: {
    userId: string;
    isEnabled?: boolean;
    preferredMethod?: string;
    backupCodesCount?: number;
  }): Promise<TwoFactorConfig> {
    const { nodeName, labelName } = this.descriptor.model;
    const query = this.neo4j.initQuery({ serialiser: this.descriptor.model });
    const setClauses: string[] = [`${nodeName}.updatedAt = datetime()`];
    query.queryParams = { userId: params.userId };

    if (params.isEnabled !== undefined) {
      setClauses.push(`${nodeName}.isEnabled = $isEnabled`);
      query.queryParams.isEnabled = params.isEnabled;
    }
    if (params.preferredMethod !== undefined) {
      setClauses.push(`${nodeName}.preferredMethod = $preferredMethod`);
      query.queryParams.preferredMethod = params.preferredMethod;
    }
    if (params.backupCodesCount !== undefined) {
      setClauses.push(`${nodeName}.backupCodesCount = $backupCodesCount`);
      query.queryParams.backupCodesCount = params.backupCodesCount;
    }

    query.query = `
      MATCH (user:User {id: $userId})-[:HAS_TWO_FACTOR_CONFIG]->(${nodeName}:${labelName})
      SET ${setClauses.join(", ")}
      RETURN ${nodeName}
    `;
    return this.neo4j.writeOne(query);
  }

  async deleteByUserId(params: { userId: string }): Promise<void> {
    const { nodeName, labelName } = this.descriptor.model;
    const query = this.neo4j.initQuery();
    query.queryParams = { userId: params.userId };
    query.query = `
      MATCH (user:User {id: $userId})-[:HAS_TWO_FACTOR_CONFIG]->(${nodeName}:${labelName})
      DETACH DELETE ${nodeName}
    `;
    await this.neo4j.writeOne(query);
  }

  async getOrCreate(params: { userId: string; configId: string }): Promise<TwoFactorConfig> {
    const existing = await this.findByUserId({ userId: params.userId });
    if (existing) return existing;
    return this.createForUser({ configId: params.configId, userId: params.userId });
  }
}
