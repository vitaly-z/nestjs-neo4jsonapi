import { Injectable, OnModuleInit } from "@nestjs/common";
import { AppLoggingService } from "../../../core/logging/services/logging.service";
import { Neo4jService } from "../../../core/neo4j/services/neo4j.service";

@Injectable()
export class ModuleRepository implements OnModuleInit {
  constructor(
    private readonly neo4j: Neo4jService,
    private readonly logger: AppLoggingService,
  ) {}

  async onModuleInit() {
    await this.neo4j.writeOne({
      query: `CREATE CONSTRAINT module_id IF NOT EXISTS FOR (module:Module) REQUIRE module.id IS UNIQUE`,
    });
  }
}
