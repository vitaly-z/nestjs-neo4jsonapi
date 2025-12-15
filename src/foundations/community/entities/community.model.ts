import { DataModelInterface } from "../../../common/interfaces/datamodel.interface";
import { companyMeta } from "../../company";
import { keyConceptMeta } from "../../keyconcept/entities/key.concept.meta";
import { Community } from "./community.entity";
import { mapCommunity } from "./community.map";
import { communityMeta } from "./community.meta";

export const CommunityModel: DataModelInterface<Community> = {
  ...communityMeta,
  entity: undefined as unknown as Community,
  mapper: mapCommunity,
  singleChildrenTokens: [companyMeta.nodeName, communityMeta.nodeName],
  childrenTokens: [keyConceptMeta.nodeName],
};
