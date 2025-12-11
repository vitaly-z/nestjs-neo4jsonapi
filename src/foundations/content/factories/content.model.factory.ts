import { mapEntity } from "../../../common/abstracts/entity";
import { DataModelInterface } from "../../../common/interfaces/datamodel.interface";
import { authorMeta, ownerMeta } from "../../user/entities/user.meta";
import { Content } from "../entities/content.entity";
import { contentMeta } from "../entities/content.meta";
import { ContentExtensionConfig } from "../interfaces/content.extension.interface";
import { ContentSerialiser } from "../serialisers/content.serialiser";

/**
 * Creates an extended ContentModel with additional relationships based on extension config.
 *
 * This factory generates a DataModelInterface with:
 * - Extended childrenTokens/singleChildrenTokens based on relationship cardinality
 * - Extended mapper that initializes all relationship fields
 *
 * The extended model is registered in modelRegistry, overwriting the base ContentModel.
 *
 * @param extension - Configuration specifying additional relationships
 * @returns DataModelInterface configured with extension relationships
 */
export function createExtendedContentModel(extension: ContentExtensionConfig): DataModelInterface<Content> {
  // Compute extended childrenTokens for many-cardinality relationships
  const extendedChildrenTokens = extension.additionalRelationships
    .filter((r) => r.cardinality === "many")
    .map((r) => r.model.nodeName);

  // Compute extended singleChildrenTokens for one-cardinality relationships
  // Note: owner and author are already single children in base model
  const extendedSingleChildrenTokens = [
    ownerMeta.nodeName,
    authorMeta.nodeName,
    ...extension.additionalRelationships.filter((r) => r.cardinality === "one").map((r) => r.model.nodeName),
  ];

  // Create extended mapper that initializes extension fields
  const extendedMapper = (params: { data: any; record: any; entityFactory: any }): Content => {
    const base: Content = {
      ...mapEntity({ record: params.data }),
      name: params.data.name,
      contentType: params.data.labels?.[0] ?? "",
      abstract: params.data.abstract,
      tldr: params.data.tldr,
      aiStatus: params.data.aiStatus,
      relevance: params.record.has("totalScore") ? Number(params.record.get("totalScore")) : 0,
      owner: undefined as any,
      author: undefined as any,
    };

    // Initialize extension relationship fields based on cardinality
    for (const rel of extension.additionalRelationships) {
      if (rel.cardinality === "many") {
        base[rel.model.nodeName] = [];
      } else {
        base[rel.model.nodeName] = undefined;
      }
    }

    return base;
  };

  return {
    ...contentMeta,
    entity: undefined as unknown as Content,
    mapper: extendedMapper,
    serialiser: ContentSerialiser,
    singleChildrenTokens: extendedSingleChildrenTokens,
    childrenTokens: extendedChildrenTokens,
  };
}
