import { Injectable, OnModuleInit } from "@nestjs/common";
import { randomUUID } from "crypto";
import { JsonApiCursorInterface } from "../../../core/jsonapi/interfaces/jsonapi.cursor.interface";
import { updateRelationshipQuery } from "../../../core/neo4j/queries/update.relationship";
import { Neo4jService } from "../../../core/neo4j/services/neo4j.service";
import { Notification } from "../../notification/entities/notification.entity";
import { notificationMeta } from "../../notification/entities/notification.meta";
import { NotificationModel } from "../../notification/entities/notification.model";
import { userMeta } from "../../user/entities/user.meta";

@Injectable()
export class NotificationRepository implements OnModuleInit {
  constructor(private readonly neo4j: Neo4jService) {}

  async onModuleInit() {
    await this.neo4j.writeOne({
      query: `CREATE CONSTRAINT notification_id IF NOT EXISTS FOR (notification:Notification) REQUIRE notification.id IS UNIQUE`,
    });
  }

  async find(params: {
    userId: string;
    cursor?: JsonApiCursorInterface;
    isArchived?: boolean;
  }): Promise<Notification[]> {
    const query = this.neo4j.initQuery({ serialiser: NotificationModel, cursor: params.cursor });

    query.queryParams = {
      ...query.queryParams,
      userId: params.userId,
    };

    query.query += `
      MATCH (${notificationMeta.nodeName}:Notification)-[:BELONGS_TO]->(company)
      MATCH (${notificationMeta.nodeName})-[:TRIGGERED_FOR]->(user:User {id: $userId})-[:BELONGS_TO]->(company)
      WHERE EXISTS { MATCH (${notificationMeta.nodeName})-[:REFERS_TO]->() }
      ${params.isArchived ? `AND ${notificationMeta.nodeName}.isArchived = true` : `AND ${notificationMeta.nodeName}.isArchived IS null`}

      WITH ${notificationMeta.nodeName}
      ORDER BY ${notificationMeta.nodeName}.createdAt DESC
      {CURSOR}

      OPTIONAL MATCH (${notificationMeta.nodeName})-[:TRIGGERED_BY]->(${notificationMeta.nodeName}_user:User)

      RETURN ${notificationMeta.nodeName},
        ${notificationMeta.nodeName}_user
    `;

    return this.neo4j.readMany(query);
  }

  async findById(params: { notificationId: string; userId: string }): Promise<Notification> {
    const query = this.neo4j.initQuery({ serialiser: NotificationModel });

    query.queryParams = {
      ...query.queryParams,
      notificationId: params.notificationId,
      userId: params.userId,
    };

    query.query += `
      MATCH (notification:Notification {id: $notificationId})-[:BELONGS_TO]->(company)
      OPTIONAL MATCH (${notificationMeta.nodeName})-[:TRIGGERED_BY]->(${notificationMeta.nodeName}_user:User)

      RETURN ${notificationMeta.nodeName},
        ${notificationMeta.nodeName}_user
    `;

    return this.neo4j.readOne(query);
  }

  async markAsRead(params: { userId: string; notificationIds: string[] }) {
    const query = this.neo4j.initQuery({ serialiser: NotificationModel });

    query.queryParams = {
      ...query.queryParams,
      userId: params.userId,
      notificationIds: params.notificationIds,
    };

    query.query += `
      MATCH (notification:Notification)-[:BELONGS_TO]->(company)
      WHERE notification.id IN $notificationIds
      MATCH (notification)-[:TRIGGERED_FOR]->(user:User {id: $userId})
      SET notification.isRead = true
    `;

    await this.neo4j.writeOne(query);
  }

  async archive(params: { notificationId: string }) {
    const query = this.neo4j.initQuery({ serialiser: NotificationModel });

    query.queryParams = {
      ...query.queryParams,
      notificationId: params.notificationId,
    };

    query.query += `
      MATCH (notification:Notification {id: $notificationId})-[:BELONGS_TO]->(company)
      SET notification.isArchived = true, notification.updatedAt = datetime()
    `;

    await this.neo4j.writeOne(query);
  }

  async create(params: { notificationType: string; userId: string; actorId?: string }): Promise<Notification> {
    const query = this.neo4j.initQuery();

    await this.neo4j.validateExistingNodes({
      nodes: [
        { id: params.userId, label: userMeta.labelName },
        params.actorId ? { id: params.actorId, label: userMeta.labelName } : null,
      ].filter(Boolean),
    });

    const notificationId: string = randomUUID();

    query.queryParams = {
      ...query.queryParams,
      notificationId: notificationId,
      notificationType: params.notificationType,
      userId: [params.userId],
      actorId: [params.actorId],
    };

    query.query += `
      CREATE (notification:Notification {
        id: $notificationId,
        notificationType: $notificationType,
        createdAt: datetime(),
        updatedAt: datetime()
      })
      CREATE (notification)-[:BELONGS_TO]->(company)
    `;

    const relationships = [
      {
        relationshipName: "TRIGGERED_FOR",
        param: "userId",
        label: userMeta.labelName,
        relationshipToNode: true,
      },
      {
        relationshipName: "TRIGGERED_BY",
        param: "actorId",
        label: userMeta.labelName,
        relationshipToNode: true,
      },
    ];

    relationships.forEach(({ relationshipName, param, label, relationshipToNode }) => {
      query.query += updateRelationshipQuery({
        node: notificationMeta.nodeName,
        relationshipName: relationshipName,
        relationshipToNode: relationshipToNode,
        label: label,
        param: param,
        values: params[param],
      });
    });

    await this.neo4j.writeOne(query);
    return this.findById({ notificationId: notificationId, userId: params.userId });
  }
}
