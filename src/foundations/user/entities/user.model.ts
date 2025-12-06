import { DataModelInterface } from "../../../common/interfaces/datamodel.interface";
import { companyMeta } from "../../company/entities/company.meta";
import { moduleMeta } from "../../module/entities/module.meta";
import { roleMeta } from "../../role/entities/role.meta";
import { User } from "../../user/entities/user.entity";
import { mapUser } from "../../user/entities/user.map";
import { assigneeMeta, authorMeta, ownerMeta, userMeta } from "../../user/entities/user.meta";
import { UserSerialiser } from "../../user/serialisers/user.serialiser";

export const UserModel: DataModelInterface<User> = {
  ...userMeta,
  entity: undefined as unknown as User,
  mapper: mapUser,
  serialiser: UserSerialiser,
  childrenTokens: [roleMeta.nodeName, moduleMeta.nodeName],
  singleChildrenTokens: [companyMeta.nodeName],
};

export const OwnerModel: DataModelInterface<User> = {
  ...UserModel,
  ...ownerMeta,
};

export const AssigneeModel: DataModelInterface<User> = {
  ...UserModel,
  ...assigneeMeta,
};

export const AuthorModel: DataModelInterface<User> = {
  ...UserModel,
  ...authorMeta,
};
