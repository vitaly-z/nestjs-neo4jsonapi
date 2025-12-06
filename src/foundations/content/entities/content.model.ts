import { DataModelInterface } from "../../../common/interfaces/datamodel.interface";
import { Content } from "../../content/entities/content.entity";
import { mapContent } from "../../content/entities/content.map";
import { contentMeta } from "../../content/entities/content.meta";
import { ContentSerialiser } from "../../content/serialisers/content.serialiser";
import { authorMeta, ownerMeta } from "../../user/entities/user.meta";

export const ContentModel: DataModelInterface<Content> = {
  ...contentMeta,
  entity: undefined as unknown as Content,
  mapper: mapContent,
  serialiser: ContentSerialiser,
  singleChildrenTokens: [ownerMeta.nodeName, authorMeta.nodeName],
  childrenTokens: [],
};
