import { describe, it, expect, vi } from "vitest";
import { PolymorphicRelationshipFactory } from "../polymorphic.relationship.factory";
import { PolymorphicConfig, PolymorphicDiscriminatorData } from "../../../../common/interfaces/entity.schema.interface";
import { DataMeta } from "../../../../common/interfaces/datamodel.interface";

const taxonomyMeta: DataMeta = {
  type: "taxonomies",
  endpoint: "taxonomies",
  nodeName: "taxonomy",
  labelName: "Taxonomy",
};

const leafTaxonomyMeta: DataMeta = {
  type: "leaf-taxonomies",
  endpoint: "leaf-taxonomies",
  nodeName: "leafTaxonomy",
  labelName: "Taxonomy",
};

const polymorphicConfig: PolymorphicConfig = {
  candidates: [taxonomyMeta, leafTaxonomyMeta],
  discriminator: (data: PolymorphicDiscriminatorData) => (data.hasParent ? leafTaxonomyMeta : taxonomyMeta),
  discriminatorRelationship: "SPECIALISES",
  discriminatorDirection: "out",
};

describe("PolymorphicRelationshipFactory", () => {
  describe("Scenario: Discriminator resolves root taxonomy", () => {
    it("should return taxonomyMeta when hasParent is false", () => {
      // GIVEN: A polymorphic factory with taxonomy discriminator config
      const mockSerialiserFactory = { create: vi.fn() } as any;
      const factory = new PolymorphicRelationshipFactory(mockSerialiserFactory, polymorphicConfig);

      // WHEN: resolve is called with hasParent = false
      const data: PolymorphicDiscriminatorData = {
        properties: { id: "tax-1", name: "Engineering" },
        labels: ["Taxonomy"],
        hasParent: false,
      };
      const result = factory.resolve(data);

      // THEN: It returns taxonomyMeta (root type)
      expect(result).toBe(taxonomyMeta);
      expect(result.type).toBe("taxonomies");
    });

    it("should return taxonomyMeta when hasParent is undefined", () => {
      // GIVEN: A polymorphic factory
      const mockSerialiserFactory = { create: vi.fn() } as any;
      const factory = new PolymorphicRelationshipFactory(mockSerialiserFactory, polymorphicConfig);

      // WHEN: resolve is called without hasParent
      const data: PolymorphicDiscriminatorData = {
        properties: { id: "tax-2", name: "Design" },
        labels: ["Taxonomy"],
      };
      const result = factory.resolve(data);

      // THEN: It returns taxonomyMeta (root type, since hasParent is falsy)
      expect(result).toBe(taxonomyMeta);
    });
  });

  describe("Scenario: Discriminator resolves leaf taxonomy", () => {
    it("should return leafTaxonomyMeta when hasParent is true", () => {
      // GIVEN: A polymorphic factory with taxonomy discriminator config
      const mockSerialiserFactory = { create: vi.fn() } as any;
      const factory = new PolymorphicRelationshipFactory(mockSerialiserFactory, polymorphicConfig);

      // WHEN: resolve is called with hasParent = true
      const data: PolymorphicDiscriminatorData = {
        properties: { id: "leaf-1", name: "React" },
        labels: ["Taxonomy"],
        hasParent: true,
      };
      const result = factory.resolve(data);

      // THEN: It returns leafTaxonomyMeta (leaf type)
      expect(result).toBe(leafTaxonomyMeta);
      expect(result.type).toBe("leaf-taxonomies");
    });
  });
});
