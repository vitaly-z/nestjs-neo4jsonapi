import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ClsService } from "nestjs-cls";
import { BaseConfigInterface, ConfigContentTypesInterface } from "../../../config/interfaces";
import { companyMeta } from "../../company/entities/company.meta";
import { contentMeta } from "../../content/entities/content.meta";
import { authorMeta, ownerMeta } from "../../user/entities/user.meta";

@Injectable()
export class ContentCypherService {
  constructor(
    private readonly clsService: ClsService,
    private readonly configService: ConfigService<BaseConfigInterface>,
  ) {}

  private getContentTypes(): string[] {
    return this.configService.get<ConfigContentTypesInterface>("contentTypes")?.types ?? [];
  }

  default(params?: { searchField: string; blockCompanyAndUser?: boolean }): string {
    return `
      MATCH (${contentMeta.nodeName}:${this.getContentTypes().join("|")} ${params ? ` {${params.searchField}: $searchValue}` : ``})
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
      MATCH (${contentMeta.nodeName})<-[:PUBLISHED]-(${contentMeta.nodeName}_${ownerMeta.nodeName}:${ownerMeta.labelName})
      MATCH (${contentMeta.nodeName})<-[:PUBLISHED]-(${contentMeta.nodeName}_${authorMeta.nodeName}:${authorMeta.labelName})
      RETURN ${contentMeta.nodeName},
        ${contentMeta.nodeName}_${companyMeta.nodeName},
        ${contentMeta.nodeName}_${ownerMeta.nodeName},
        ${contentMeta.nodeName}_${authorMeta.nodeName}
        ${params?.useTotalScore ? `, totalScore` : ``}
    `;
  };
}
