import { Injectable } from "@nestjs/common";
import { ClsService } from "nestjs-cls";
import { contentTypes } from "../../../config/enums/content.types";
import { companyMeta } from "../../company/entities/company.meta";
import { contentMeta } from "../../content/entities/content.meta";
import { ownerMeta, userMeta } from "../../user/entities/user.meta";

@Injectable()
export class ContentCypherService {
  constructor(private readonly clsService: ClsService) {}

  default(params?: { searchField: string; blockCompanyAndUser?: boolean }): string {
    return `
      MATCH (${contentMeta.nodeName}:${contentTypes.map((type: string) => `${type}`).join("|")} ${params ? ` {${params.searchField}: $searchValue}` : ``})
      WHERE ${contentMeta.nodeName}.tldr IS NOT NULL
      AND ${contentMeta.nodeName}.tldr <> ""
      AND $companyId IS NULL
      OR EXISTS {
        MATCH (${contentMeta.nodeName})-[:BELONGS_TO]-(company)
      }
      WITH ${contentMeta.nodeName}${params?.blockCompanyAndUser ? `` : `, company, currentUser`}
    `;
  }

  userHasAccess = (params?: { useTotalScore?: boolean }): string => {
    const companyId = this.clsService.get("companyId");
    const userId = this.clsService.get("userId");

    return `
      WITH ${contentMeta.nodeName}${companyId ? `, ${companyMeta.nodeName}` : ``}${userId ? `, currentUser` : ``}${params?.useTotalScore ? `, totalScore` : ``}
    `;
  };

  returnStatement = (params?: { useTotalScore?: boolean }) => {
    return `
      MATCH (${contentMeta.nodeName})-[:BELONGS_TO]->(${contentMeta.nodeName}_${companyMeta.nodeName}:${companyMeta.labelName})
      MATCH (${contentMeta.nodeName})<-[:PUBLISHED]-(${contentMeta.nodeName}_${ownerMeta.nodeName}:${userMeta.labelName})
      RETURN ${contentMeta.nodeName},
        ${contentMeta.nodeName}_${companyMeta.nodeName},
        ${contentMeta.nodeName}_${ownerMeta.nodeName}
        ${params?.useTotalScore ? `, totalScore` : ``}
    `;
  };
}
