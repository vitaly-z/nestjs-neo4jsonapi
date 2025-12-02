import { Injectable } from "@nestjs/common";
import { ClsService } from "nestjs-cls";
import { CypherService } from "../../../core/neo4j/services/cypher.service";
import { userMeta } from "../../user/entities/user.meta";

@Injectable()
export class UserCypherService {
  constructor(
    private readonly cypherService: CypherService,
    private readonly clsService: ClsService,
  ) {}

  default(params?: { searchField: string }): string {
    return `
      MATCH (${userMeta.nodeName}:${userMeta.labelName}${params ? ` {${params.searchField}: $searchValue}` : ``})
      WHERE $companyId IS NULL
      OR EXISTS {
        MATCH (user)-[:BELONGS_TO]-(company)
      }
    `;
  }

  userHasAccess = (): string => {
    return ``;
  };

  returnStatement = (): string => {
    return `
        RETURN ${userMeta.nodeName}
    `;
  };
}
