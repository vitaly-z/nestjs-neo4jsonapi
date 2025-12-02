import { DataModelInterface } from "../../../common/interfaces/datamodel.interface";
import { Auth } from "../../auth/entities/auth.entity";
import { mapAuth } from "../../auth/entities/auth.map";
import { authMeta } from "../../auth/entities/auth.meta";
import { AuthSerialiser } from "../../auth/serialisers/auth.serialiser";
import { userMeta } from "../../user/entities/user.meta";

export const AuthModel: DataModelInterface<Auth> = {
  ...authMeta,
  entity: undefined as unknown as Auth,
  mapper: mapAuth,
  serialiser: AuthSerialiser,
  singleChildrenTokens: [userMeta.nodeName],
};
