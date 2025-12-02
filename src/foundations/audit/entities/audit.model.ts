import { DataModelInterface } from "../../../common/interfaces/datamodel.interface";
import { Audit } from "../../audit/entities/audit.entity";
import { mapAudit } from "../../audit/entities/audit.map";
import { auditMeta } from "../../audit/entities/audit.meta";
import { AuditSerialiser } from "../../audit/serialisers/audit.serialiser";
import { userMeta } from "../../user/entities/user.meta";

export const auditModel: DataModelInterface<Audit> = {
  ...auditMeta,
  entity: undefined as unknown as Audit,
  mapper: mapAudit,
  serialiser: AuditSerialiser,
  singleChildrenTokens: [userMeta.nodeName],
  // dynamicChildrenPatterns: ["{parent}_{*}"],
  dynamicSingleChildrenPatterns: ["{parent}_{*}"],
};
