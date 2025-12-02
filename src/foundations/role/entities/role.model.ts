import { DataModelInterface } from "../../../common/interfaces/datamodel.interface";
import { featureMeta } from "../../feature/entities/feature.meta";
import { Role } from "../../role/entities/role.entity";
import { mapRole } from "../../role/entities/role.map";
import { roleMeta } from "../../role/entities/role.meta";
import { RoleSerialiser } from "../../role/serialisers/role.serialiser";

export const RoleModel: DataModelInterface<Role> = {
  ...roleMeta,
  entity: undefined as unknown as Role,
  mapper: mapRole,
  serialiser: RoleSerialiser,
  singleChildrenTokens: [featureMeta.nodeName],
};
