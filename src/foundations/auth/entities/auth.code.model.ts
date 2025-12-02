import { DataModelInterface } from "../../../common/interfaces/datamodel.interface";
import { AuthCode } from "../../auth/entities/auth.code.entity";
import { mapAuthCode } from "../../auth/entities/auth.code.map";
import { authCodeMeta } from "../../auth/entities/auth.code.meta";
import { authMeta } from "../../auth/entities/auth.meta";

export const AuthCodeModel: DataModelInterface<AuthCode> = {
  ...authCodeMeta,
  entity: undefined as unknown as AuthCode,
  mapper: mapAuthCode,
  singleChildrenTokens: [authMeta.nodeName],
};
