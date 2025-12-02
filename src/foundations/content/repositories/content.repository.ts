import { Document } from "@langchain/core/documents";
import { Injectable } from "@nestjs/common";
import { contentTypes } from "../../../config/enums/content.types";
import { JsonApiCursorInterface } from "../../../core/jsonapi/interfaces/jsonapi.cursor.interface";
import { Neo4jService } from "../../../core/neo4j/services/neo4j.service";
import { SecurityService } from "../../../core/security/services/security.service";
import { Content } from "../../content/entities/content.entity";
import { contentMeta } from "../../content/entities/content.meta";
import { ContentModel } from "../../content/entities/content.model";
import { ContentCypherService } from "../../content/services/content.cypher.service";
import { ownerMeta } from "../../user/entities/user.meta";

@Injectable()
export class ContentRepository {
  constructor(
    private readonly neo4j: Neo4jService,
    private readonly contentCypherService: ContentCypherService,
    private readonly securityService: SecurityService,
  ) {}

  async find(params: {
    fetchAll?: boolean;
    term?: string;
    orderBy?: string;
    cursor?: JsonApiCursorInterface;
  }): Promise<Content[]> {
    const query = this.neo4j.initQuery({
      cursor: params.cursor,
      serialiser: ContentModel,
      fetchAll: params.fetchAll,
    });

    query.queryParams = {
      ...query.queryParams,
      term: params.term,
    };

    query.query += `
      ${this.contentCypherService.default()}
      ${this.securityService.userHasAccess({ validator: this.contentCypherService.userHasAccess })}
      
      ORDER BY ${contentMeta.nodeName}.${params.orderBy ? `${params.orderBy}` : `updatedAt DESC`}
      {CURSOR}

      ${this.contentCypherService.returnStatement()}
    `;

    return this.neo4j.readMany(query);
  }

  async findByIds(params: { contentIds: string[] }): Promise<Document[]> {
    const query = this.neo4j.initQuery({ serialiser: ContentModel });

    query.queryParams = {
      ...query.queryParams,
      ids: params.contentIds,
    };

    query.query += `
        MATCH (${contentMeta.nodeName}:${contentTypes.map((type: string) => `${type}`).join("|")})-[:BELONGS_TO]->(company)
        WHERE ${contentMeta.nodeName}.id IN $ids 
        AND ${contentMeta.nodeName}.tldr IS NOT NULL
        AND ${contentMeta.nodeName}.tldr <> ""
        ${this.securityService.userHasAccess({ validator: this.contentCypherService.userHasAccess })}
        ${this.contentCypherService.returnStatement()}
      `;

    return this.neo4j.readMany(query);
  }

  async findByOwner(params: {
    ownerId: string;
    term?: string;
    orderBy?: string;
    fetchAll?: boolean;
    cursor?: JsonApiCursorInterface;
  }) {
    const query = this.neo4j.initQuery({
      serialiser: ContentModel,
      cursor: params.cursor,
      fetchAll: params.fetchAll,
    });

    query.queryParams = {
      ...query.queryParams,
      ownerId: params.ownerId,
      term: params.term,
    };

    query.query += `
      ${this.contentCypherService.default()}
      ${this.securityService.userHasAccess({ validator: this.contentCypherService.userHasAccess })}
      
      ORDER BY ${contentMeta.nodeName}.${params.orderBy ? `${params.orderBy}` : `updatedAt DESC`}
      MATCH (${contentMeta.nodeName})<-[:PUBLISHED]-(:${ownerMeta.labelName} {id: $ownerId})
      {CURSOR}

      ${this.contentCypherService.returnStatement()}
    `;

    return this.neo4j.readMany(query);
  }
}
