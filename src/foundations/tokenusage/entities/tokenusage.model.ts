import { DataModelInterface } from "../../../common/interfaces/datamodel.interface";
import { companyMeta } from "../../company/entities/company.meta";
import { TokenUsage } from "../../tokenusage/entities/tokenusage.entity";
import { mapTokenUsage } from "../../tokenusage/entities/tokenusage.map";
import { tokenUsageMeta } from "../../tokenusage/entities/tokenusage.meta";

export const TokenUsageModel: DataModelInterface<TokenUsage> = {
  ...tokenUsageMeta,
  entity: undefined as unknown as TokenUsage,
  mapper: mapTokenUsage,
  serialiser: undefined,
  singleChildrenTokens: [companyMeta.nodeName],
  childrenTokens: [],
};
