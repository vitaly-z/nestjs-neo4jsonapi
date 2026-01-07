import { DataModelInterface } from "../../../common/interfaces/datamodel.interface";
import { companyMeta } from "../../company/entities/company.meta";
import { userMeta } from "../../user/entities/user.meta";
import { OAuthClient } from "./oauth.client.entity";
import { mapOAuthClient } from "./oauth.client.map";
import { oauthClientMeta } from "./oauth.client.meta";

export const OAuthClientModel: DataModelInterface<OAuthClient> = {
  ...oauthClientMeta,
  entity: undefined as unknown as OAuthClient,
  mapper: mapOAuthClient,
  serialiser: undefined as any, // Will be added in serializer task
  singleChildrenTokens: [userMeta.nodeName, companyMeta.nodeName],
};
