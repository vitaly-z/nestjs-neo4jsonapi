import { Injectable } from "@nestjs/common";
import { AbstractRepository, Neo4jService, SecurityService } from "../../../core";
import { DiscordUser, DiscordUserDescriptor } from "../entities/discord-user";

@Injectable()
export class DiscordUserRepository extends AbstractRepository<DiscordUser, typeof DiscordUserDescriptor.relationships> {
  protected readonly descriptor = DiscordUserDescriptor;
  constructor(neo4j: Neo4jService, securityService: SecurityService) {
    super(neo4j, securityService);
  }

  async findByDiscordId(params: { discordId: string }): Promise<DiscordUser> {
    const query = this.neo4j.initQuery({ serialiser: this.descriptor.model });

    query.queryParams = {
      discordId: params.discordId,
    };

    query.query = `
      MATCH (${DiscordUserDescriptor.model.nodeName}:${DiscordUserDescriptor.model.labelName} { discordId: $discordId })
      ${this.buildReturnStatement()}
    `;

    return this.neo4j.readOne(query);
  }
}
