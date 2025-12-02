import { Injectable, OnModuleInit } from "@nestjs/common";
import { JsonApiCursorInterface } from "../../../core/jsonapi/interfaces/jsonapi.cursor.interface";
import { AppLoggingService } from "../../../core/logging/services/logging.service";
import { Neo4jService } from "../../../core/neo4j/services/neo4j.service";
import { Feature } from "../../feature/entities/feature.entity";
import { FeatureModel } from "../../feature/entities/feature.model";

@Injectable()
export class FeatureRepository implements OnModuleInit {
  constructor(
    private readonly neo4j: Neo4jService,
    private readonly logger: AppLoggingService,
  ) {}

  async onModuleInit() {
    await this.neo4j.writeOne({
      query: `CREATE CONSTRAINT feature_id IF NOT EXISTS FOR (feature:Feature) REQUIRE feature.id IS UNIQUE`,
    });
  }

  async findByCompany(params: { companyId: string }): Promise<Feature[]> {
    const query = this.neo4j.initQuery({ serialiser: FeatureModel });

    query.queryParams = {
      companyId: params.companyId,
    };

    query.query = `
      MATCH (company:Company {id: $companyId})-[:HAS_FEATURE]->(feature:Feature)
      RETURN feature
    `;

    return this.neo4j.readMany(query);
  }

  async find(params: { term?: string; cursor: JsonApiCursorInterface }): Promise<Feature[]> {
    const query = this.neo4j.initQuery({ serialiser: FeatureModel, cursor: params.cursor });

    query.queryParams = {
      term: params.term,
    };

    query.query = `
      MATCH (feature:Feature)
      ${params.term ? "WHERE toLower(feature.name) CONTAINS toLower($term)" : ""}
      
      WITH feature
      ORDER BY feature.name ASC
      {CURSOR}
      
      OPTIONAL MATCH (feature)<-[:IN_FEATURE]-(feature_module:Module)

      RETURN feature, feature_module
    `;

    return this.neo4j.readMany(query);
  }
}
