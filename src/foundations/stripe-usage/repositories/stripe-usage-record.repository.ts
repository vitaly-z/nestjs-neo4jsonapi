import { Injectable, OnModuleInit } from "@nestjs/common";
import { randomUUID } from "crypto";
import { Neo4jService } from "../../../core/neo4j";
import { stripeSubscriptionMeta } from "../../stripe-subscription/entities/stripe-subscription.meta";
import { StripeUsageRecord } from "../entities/stripe-usage-record.entity";
import { stripeUsageRecordMeta } from "../entities/stripe-usage-record.meta";
import { StripeUsageRecordModel } from "../entities/stripe-usage-record.model";

/**
 * StripeUsageRecordRepository
 *
 * Neo4j repository for managing StripeUsageRecord nodes and their relationships to Subscription nodes.
 * Tracks usage events for metered billing with time-based filtering and aggregation.
 *
 * Key Features:
 * - Automatic constraint creation for ID uniqueness and subscription indexing
 * - Query usage records by subscription with time range filtering
 * - Create operations for recording usage events
 * - Aggregation support for usage summaries by meter
 * - Integration with Stripe V2 Billing Meters
 * - Stores meter ID and event name for tracking
 * - Links to Stripe event IDs for idempotency
 */
@Injectable()
export class StripeUsageRecordRepository implements OnModuleInit {
  constructor(private readonly neo4j: Neo4jService) {}

  /**
   * Initialize repository constraints and indexes
   */
  async onModuleInit() {
    await this.neo4j.writeOne({
      query: `CREATE CONSTRAINT ${stripeUsageRecordMeta.nodeName}_id IF NOT EXISTS FOR (${stripeUsageRecordMeta.nodeName}:${stripeUsageRecordMeta.labelName}) REQUIRE ${stripeUsageRecordMeta.nodeName}.id IS UNIQUE`,
    });

    await this.neo4j.writeOne({
      query: `CREATE INDEX ${stripeUsageRecordMeta.nodeName}_subscriptionId_idx IF NOT EXISTS FOR (${stripeUsageRecordMeta.nodeName}:${stripeUsageRecordMeta.labelName}) ON (${stripeUsageRecordMeta.nodeName}.subscriptionId)`,
    });
  }

  /**
   * Find usage records by subscription ID
   */
  async findBySubscriptionId(params: {
    subscriptionId: string;
    startTime?: Date;
    endTime?: Date;
    limit?: number;
  }): Promise<StripeUsageRecord[]> {
    const query = this.neo4j.initQuery({ serialiser: StripeUsageRecordModel });

    const whereParams: string[] = [`${stripeUsageRecordMeta.nodeName}.subscriptionId = $subscriptionId`];

    query.queryParams = {
      subscriptionId: params.subscriptionId,
      limit: params.limit ?? 100,
    };

    if (params.startTime) {
      query.queryParams.startTime = params.startTime.toISOString();
      whereParams.push(`${stripeUsageRecordMeta.nodeName}.timestamp >= datetime($startTime)`);
    }

    if (params.endTime) {
      query.queryParams.endTime = params.endTime.toISOString();
      whereParams.push(`${stripeUsageRecordMeta.nodeName}.timestamp <= datetime($endTime)`);
    }

    query.query = `
      MATCH (${stripeUsageRecordMeta.nodeName}:${stripeUsageRecordMeta.labelName})
      WHERE ${whereParams.join(" AND ")}
      OPTIONAL MATCH (${stripeUsageRecordMeta.nodeName})-[:BELONGS_TO]->(${stripeSubscriptionMeta.nodeName}:${stripeSubscriptionMeta.labelName})
      RETURN ${stripeUsageRecordMeta.nodeName}, ${stripeSubscriptionMeta.nodeName}
      ORDER BY ${stripeUsageRecordMeta.nodeName}.timestamp DESC
      LIMIT $limit
    `;

    return this.neo4j.readMany(query);
  }

  /**
   * Create a new usage record
   */
  async create(params: {
    subscriptionId: string;
    meterId: string;
    meterEventName: string;
    quantity: number;
    timestamp: Date;
    stripeEventId?: string;
  }): Promise<StripeUsageRecord> {
    const query = this.neo4j.initQuery({ serialiser: StripeUsageRecordModel });

    const id = randomUUID();

    query.queryParams = {
      id,
      subscriptionId: params.subscriptionId,
      meterId: params.meterId,
      meterEventName: params.meterEventName,
      quantity: params.quantity,
      timestamp: params.timestamp.toISOString(),
      stripeEventId: params.stripeEventId ?? null,
    };

    query.query = `
      MATCH (${stripeSubscriptionMeta.nodeName}:${stripeSubscriptionMeta.labelName} {id: $subscriptionId})
      CREATE (${stripeUsageRecordMeta.nodeName}:${stripeUsageRecordMeta.labelName} {
        id: $id,
        subscriptionId: $subscriptionId,
        meterId: $meterId,
        meterEventName: $meterEventName,
        quantity: $quantity,
        timestamp: datetime($timestamp),
        stripeEventId: $stripeEventId,
        createdAt: datetime(),
        updatedAt: datetime()
      })
      CREATE (${stripeUsageRecordMeta.nodeName})-[:BELONGS_TO]->(${stripeSubscriptionMeta.nodeName})
      RETURN ${stripeUsageRecordMeta.nodeName}
    `;

    return this.neo4j.writeOne(query);
  }

  /**
   * Get usage summary for a subscription
   */
  async getUsageSummary(params: { subscriptionId: string; startTime: Date; endTime: Date }): Promise<{
    total: number;
    count: number;
    byMeter: Record<string, number>;
  }> {
    const cypher = `
      MATCH (${stripeUsageRecordMeta.nodeName}:${stripeUsageRecordMeta.labelName})
      WHERE ${stripeUsageRecordMeta.nodeName}.subscriptionId = $subscriptionId
        AND ${stripeUsageRecordMeta.nodeName}.timestamp >= datetime($startTime)
        AND ${stripeUsageRecordMeta.nodeName}.timestamp <= datetime($endTime)
      WITH ${stripeUsageRecordMeta.nodeName}
      RETURN
        sum(${stripeUsageRecordMeta.nodeName}.quantity) as total,
        count(${stripeUsageRecordMeta.nodeName}) as count,
        collect({meterId: ${stripeUsageRecordMeta.nodeName}.meterId, quantity: ${stripeUsageRecordMeta.nodeName}.quantity}) as records
    `;

    const queryParams = {
      subscriptionId: params.subscriptionId,
      startTime: params.startTime.toISOString(),
      endTime: params.endTime.toISOString(),
    };

    const result = await this.neo4j.read(cypher, queryParams);

    if (!result || result.length === 0) {
      return { total: 0, count: 0, byMeter: {} };
    }

    const row = result[0];
    const byMeter: Record<string, number> = {};
    const records = row.records || [];
    for (const record of records) {
      byMeter[record.meterId] = (byMeter[record.meterId] || 0) + Number(record.quantity ?? 0);
    }

    return {
      total: Number(row.total ?? 0),
      count: Number(row.count ?? 0),
      byMeter,
    };
  }
}
