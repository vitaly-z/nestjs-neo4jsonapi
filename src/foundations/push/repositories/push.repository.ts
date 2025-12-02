import { Injectable } from "@nestjs/common";
import { randomUUID } from "crypto";
import { Neo4jService } from "../../../core/neo4j/services/neo4j.service";
import { Push } from "../../push/entities/push.entity";
import { PushModel } from "../../push/entities/push.model";

@Injectable()
export class PushRepository {
  constructor(private readonly neo4j: Neo4jService) {}

  async findByUserId(params: { userId: string }): Promise<Push[]> {
    const query = this.neo4j.initQuery({ serialiser: PushModel });

    query.queryParams = {
      ...query.queryParams,
      userId: params.userId,
    };

    query.query += `
        MATCH (user:User {id: $userId})-[:BELONGS_TO]->(company)
        MATCH (push:PushSubscription)<-[:HAS_PUSH]-(user)
        RETURN push
    `;

    return this.neo4j.readMany(query);
  }

  async findByEndpoint(params: { endpoint: string }): Promise<Push[]> {
    const query = this.neo4j.initQuery({ serialiser: PushModel });

    query.queryParams = {
      ...query.queryParams,
      endpoint: params.endpoint,
    };

    query.query += `
        MATCH (user:User {id: $currentUserId})-[:BELONGS_TO]->(company)
        MATCH (push:PushSubscription {endpoint: $endpoint})<-[:HAS_PUSH]-(user)
        RETURN push
    `;

    return this.neo4j.readMany(query);
  }

  async create(params: { endpoint: string; p256dh: string; auth: string }): Promise<void> {
    const query = this.neo4j.initQuery();

    query.queryParams = {
      ...query.queryParams,
      id: randomUUID(),
      endpoint: params.endpoint,
      p256dh: params.p256dh,
      auth: params.auth,
    };

    query.query = `
        MATCH (user:User {id: $currentUserId})-[:BELONGS_TO]->(company)
        CREATE (push:PushSubscription {
            id: $id, 
            endpoint: $endpoint,
            p256dh: $p256dh,
            auth: $auth,
            createdAt: datetime(), 
            updatedAt: datetime()})
            CREATE (user)-[:HAS_PUSH]->(push)
    `;

    await this.neo4j.writeOne(query);
  }
}
