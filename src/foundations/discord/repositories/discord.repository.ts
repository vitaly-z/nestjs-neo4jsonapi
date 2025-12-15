import { Injectable } from "@nestjs/common";
import { AbstractRepository, Neo4jService, SecurityService } from "../../../core";
import { Discord, DiscordDescriptor } from "../entities/discord";

@Injectable()
export class DiscordRepository extends AbstractRepository<Discord, typeof DiscordDescriptor.relationships> {
  protected readonly descriptor = DiscordDescriptor;

  constructor(neo4j: Neo4jService, securityService: SecurityService) {
    super(neo4j, securityService);
  }

  async findByDiscordId(params: { discordId: string }): Promise<Discord> {
    const query = this.neo4j.initQuery({ serialiser: this.descriptor.model });

    query.queryParams = {
      discordId: params.discordId,
    };

    query.query = `
      MATCH (${DiscordDescriptor.model.nodeName}:${DiscordDescriptor.model.labelName} { discordId: $discordId })
      ${this.buildReturnStatement()}
    `;

    return this.neo4j.readOne(query);
  }
}
