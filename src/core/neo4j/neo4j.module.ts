import { Module } from "@nestjs/common";
import { EntityFactory } from "./factories/entity.factory";
import { CypherService } from "./services/cypher.service";
import { Neo4jService } from "./services/neo4j.service";
import { TokenResolverService } from "./services/token-resolver.service";

@Module({
  providers: [Neo4jService, EntityFactory, CypherService, TokenResolverService],
  exports: [Neo4jService, CypherService],
})
export class Neo4JModule {}
