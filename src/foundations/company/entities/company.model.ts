import { DataModelInterface } from "../../../common/interfaces/datamodel.interface";
import { Company } from "../../company/entities/company.entity";
import { mapCompany } from "../../company/entities/company.map";
import { companyMeta } from "../../company/entities/company.meta";
import { CompanySerialiser } from "../../company/serialisers/company.serialiser";
import { featureMeta } from "../../feature/entities/feature.meta";
import { moduleMeta } from "../../module/entities/module.meta";

export const CompanyModel: DataModelInterface<Company> = {
  ...companyMeta,
  entity: undefined as unknown as Company,
  mapper: mapCompany,
  serialiser: CompanySerialiser,
  singleChildrenTokens: [],
  childrenTokens: [featureMeta.nodeName, moduleMeta.nodeName],
};
