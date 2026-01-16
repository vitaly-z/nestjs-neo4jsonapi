/**
 * Descriptor Generator Unit Tests
 *
 * Tests the code generation functions that produce new-style descriptor files.
 */

import { describe, it, expect } from "vitest";
import * as path from "path";
import {
  generateDescriptor,
  generateMetaFile,
  generateEntityFile,
} from "../lib/descriptor-generator";
import { parseOldFiles } from "../lib/ast-parser";
import { OldEntityFiles, ParsedEntity, ParsedMeta } from "../lib/types";

const FIXTURES_DIR = path.resolve(__dirname, "../__fixtures__");

/**
 * Helper to get parsed entity from test fixtures
 */
function getParsedTestEntity(): ParsedEntity {
  const files: OldEntityFiles = {
    entityName: "TestEntity",
    entityDir: path.join(FIXTURES_DIR, "entities"),
    entity: path.join(FIXTURES_DIR, "entities/test-entity.ts"),
    meta: path.join(FIXTURES_DIR, "entities/test-entity.meta.ts"),
    model: path.join(FIXTURES_DIR, "entities/test-entity.model.ts"),
    map: path.join(FIXTURES_DIR, "entities/test-entity.map.ts"),
    serialiser: path.join(FIXTURES_DIR, "entities/test-entity.serialiser.ts"),
  };
  return parseOldFiles(files);
}

function getParsedSimpleEntity(): ParsedEntity {
  const files: OldEntityFiles = {
    entityName: "SimpleEntity",
    entityDir: path.join(FIXTURES_DIR, "simple-entity"),
    entity: path.join(FIXTURES_DIR, "simple-entity/simple-entity.ts"),
    meta: path.join(FIXTURES_DIR, "simple-entity/simple-entity.meta.ts"),
    model: path.join(FIXTURES_DIR, "simple-entity/simple-entity.model.ts"),
    map: path.join(FIXTURES_DIR, "simple-entity/simple-entity.map.ts"),
    serialiser: path.join(FIXTURES_DIR, "simple-entity/simple-entity.serialiser.ts"),
  };
  return parseOldFiles(files);
}

function getParsedComplexEntity(): ParsedEntity {
  const files: OldEntityFiles = {
    entityName: "ComplexEntity",
    entityDir: path.join(FIXTURES_DIR, "complex-entity"),
    entity: path.join(FIXTURES_DIR, "complex-entity/complex-entity.ts"),
    meta: path.join(FIXTURES_DIR, "complex-entity/complex-entity.meta.ts"),
    model: path.join(FIXTURES_DIR, "complex-entity/complex-entity.model.ts"),
    map: path.join(FIXTURES_DIR, "complex-entity/complex-entity.map.ts"),
    serialiser: path.join(FIXTURES_DIR, "complex-entity/complex-entity.serialiser.ts"),
  };
  return parseOldFiles(files);
}

describe("descriptor-generator", () => {
  describe("generateDescriptor", () => {
    it("should generate valid TypeScript code", () => {
      const parsed = getParsedTestEntity();
      const entityDir = path.join(FIXTURES_DIR, "entities");

      const result = generateDescriptor(parsed, entityDir);

      expect(result.code).toContain("export const TestEntityDescriptor = defineEntity<TestEntity>()");
      expect(result.code).toContain("...testEntityMeta");
    });

    it("should include injectServices when S3 transforms present", () => {
      const parsed = getParsedTestEntity();
      const entityDir = path.join(FIXTURES_DIR, "entities");

      const result = generateDescriptor(parsed, entityDir);

      expect(result.code).toContain("injectServices: [S3Service]");
    });

    it("should exclude injectServices when no transforms", () => {
      const parsed = getParsedSimpleEntity();
      const entityDir = path.join(FIXTURES_DIR, "simple-entity");

      const result = generateDescriptor(parsed, entityDir);

      expect(result.code).not.toContain("injectServices");
    });

    it("should include all fields", () => {
      const parsed = getParsedTestEntity();
      const entityDir = path.join(FIXTURES_DIR, "entities");

      const result = generateDescriptor(parsed, entityDir);

      expect(result.code).toContain("fields:");
      expect(result.code).toContain("name:");
      expect(result.code).toContain("description:");
      expect(result.code).toContain("url:");
      expect(result.code).toContain("tags:");
    });

    it("should include computed fields", () => {
      const parsed = getParsedTestEntity();
      const entityDir = path.join(FIXTURES_DIR, "entities");

      const result = generateDescriptor(parsed, entityDir);

      expect(result.code).toContain("computed:");
      expect(result.code).toContain("relevance:");
      expect(result.code).toContain("itemCount:");
    });

    it("should include relationships", () => {
      const parsed = getParsedTestEntity();
      const entityDir = path.join(FIXTURES_DIR, "entities");

      const result = generateDescriptor(parsed, entityDir);

      expect(result.code).toContain("relationships:");
      expect(result.code).toContain("author:");
      expect(result.code).toContain('direction: "in"');
      expect(result.code).toContain('cardinality: "one"');
    });

    it("should generate correct imports", () => {
      const parsed = getParsedTestEntity();
      const entityDir = path.join(FIXTURES_DIR, "entities");

      const result = generateDescriptor(parsed, entityDir);

      expect(result.imports.length).toBeGreaterThan(0);
      expect(result.imports.some((i) => i.includes("defineEntity"))).toBe(true);
      expect(result.imports.some((i) => i.includes("Entity"))).toBe(true);
      expect(result.imports.some((i) => i.includes("S3Service"))).toBe(true);
    });

    it("should not include S3Service in imports when no transforms", () => {
      const parsed = getParsedSimpleEntity();
      const entityDir = path.join(FIXTURES_DIR, "simple-entity");

      const result = generateDescriptor(parsed, entityDir);

      expect(result.imports.some((i) => i.includes("S3Service"))).toBe(false);
    });

    it("should generate type export", () => {
      const parsed = getParsedTestEntity();
      const entityDir = path.join(FIXTURES_DIR, "entities");

      const result = generateDescriptor(parsed, entityDir);

      expect(result.code).toContain("export type TestEntityDescriptorType = typeof TestEntityDescriptor");
    });
  });

  describe("generateDescriptor - field configs", () => {
    it("should create field config with correct type (string)", () => {
      const parsed = getParsedSimpleEntity();
      const entityDir = path.join(FIXTURES_DIR, "simple-entity");

      const result = generateDescriptor(parsed, entityDir);

      expect(result.code).toContain('title: { type: "string"');
    });

    it("should create field config with correct type (number)", () => {
      const parsed = getParsedSimpleEntity();
      const entityDir = path.join(FIXTURES_DIR, "simple-entity");

      const result = generateDescriptor(parsed, entityDir);

      expect(result.code).toContain('count: { type: "number"');
    });

    it("should create field config with correct type (boolean)", () => {
      const parsed = getParsedSimpleEntity();
      const entityDir = path.join(FIXTURES_DIR, "simple-entity");

      const result = generateDescriptor(parsed, entityDir);

      expect(result.code).toContain('isActive: { type: "boolean"');
    });

    it("should create field config with correct type (Date -> datetime)", () => {
      const parsed = getParsedSimpleEntity();
      const entityDir = path.join(FIXTURES_DIR, "simple-entity");

      const result = generateDescriptor(parsed, entityDir);

      expect(result.code).toContain('createdAt: { type: "datetime"');
    });

    it("should create field config with array type (string[])", () => {
      const parsed = getParsedTestEntity();
      const entityDir = path.join(FIXTURES_DIR, "entities");

      const result = generateDescriptor(parsed, entityDir);

      expect(result.code).toContain('tags: { type: "string[]"');
    });

    it("should mark required fields", () => {
      const parsed = getParsedTestEntity();
      const entityDir = path.join(FIXTURES_DIR, "entities");

      const result = generateDescriptor(parsed, entityDir);

      expect(result.code).toContain("required: true");
    });

    it("should identify meta fields", () => {
      const parsed = getParsedTestEntity();
      const entityDir = path.join(FIXTURES_DIR, "entities");

      const result = generateDescriptor(parsed, entityDir);

      expect(result.code).toContain("meta: true");
    });

    it("should add S3 transforms for URL fields", () => {
      const parsed = getParsedTestEntity();
      const entityDir = path.join(FIXTURES_DIR, "entities");

      const result = generateDescriptor(parsed, entityDir);

      // Single URL transform
      expect(result.code).toContain("url: {");
      expect(result.code).toContain("transform: async (data, services) => {");
      expect(result.code).toContain("services.S3Service.generateSignedUrl");

      // Array URL transform
      expect(result.code).toContain("samplePhotographs: {");
      expect(result.code).toContain("Promise.all");
    });
  });

  describe("generateDescriptor - computed configs", () => {
    it("should create computed config from mapper", () => {
      const parsed = getParsedTestEntity();
      const entityDir = path.join(FIXTURES_DIR, "entities");

      const result = generateDescriptor(parsed, entityDir);

      expect(result.code).toContain("computed:");
      expect(result.code).toContain("compute: (params) =>");
    });

    it("should include params.record.has patterns in computed", () => {
      const parsed = getParsedTestEntity();
      const entityDir = path.join(FIXTURES_DIR, "entities");

      const result = generateDescriptor(parsed, entityDir);

      expect(result.code).toContain("params.record.has");
    });

    it("should mark meta computed fields", () => {
      const parsed = getParsedTestEntity();
      const entityDir = path.join(FIXTURES_DIR, "entities");

      const result = generateDescriptor(parsed, entityDir);

      // relevance should have meta: true
      const computedSection = result.code.split("computed:")[1]?.split("relationships:")[0];
      expect(computedSection).toContain("meta: true");
    });
  });

  describe("generateDescriptor - relationship configs", () => {
    it("should use heuristics when Cypher unavailable", () => {
      const parsed = getParsedTestEntity();
      const entityDir = path.join(FIXTURES_DIR, "entities");

      const result = generateDescriptor(parsed, entityDir);

      // author relationship should use heuristic (PUBLISHED)
      expect(result.code).toContain("author:");
      expect(result.code).toContain('relationship: "PUBLISHED"');
    });

    it("should determine cardinality from relationship type", () => {
      const parsed = getParsedTestEntity();
      const entityDir = path.join(FIXTURES_DIR, "entities");

      const result = generateDescriptor(parsed, entityDir);

      // author is a single User, so cardinality should be "one"
      expect(result.code).toContain('cardinality: "one"');
    });

    it("should include dtoKey when present", () => {
      const parsed = getParsedComplexEntity();
      const entityDir = path.join(FIXTURES_DIR, "complex-entity");

      const result = generateDescriptor(parsed, entityDir);

      // items has dtoKey in the fixture
      expect(result.code).toContain('dtoKey: "items"');
    });

    it("should handle multiple relationships", () => {
      const parsed = getParsedComplexEntity();
      const entityDir = path.join(FIXTURES_DIR, "complex-entity");

      const result = generateDescriptor(parsed, entityDir);

      expect(result.code).toContain("author:");
      expect(result.code).toContain("company:");
      expect(result.code).toContain("items:");
    });
  });

  describe("generateMetaFile", () => {
    it("should generate meta file with correct export", () => {
      const meta: ParsedMeta = {
        type: "test-entities",
        endpoint: "test-entities",
        nodeName: "testEntity",
        labelName: "TestEntity",
      };

      const result = generateMetaFile(meta);

      expect(result).toContain('import { DataMeta } from "@carlonicora/nestjs-neo4jsonapi"');
      expect(result).toContain("export const testEntityMeta: DataMeta = {");
      expect(result).toContain('type: "test-entities"');
      expect(result).toContain('endpoint: "test-entities"');
      expect(result).toContain('nodeName: "testEntity"');
      expect(result).toContain('labelName: "TestEntity"');
    });

    it("should generate meta file for simple-entity", () => {
      const meta: ParsedMeta = {
        type: "simple-entities",
        endpoint: "simple-entities",
        nodeName: "simpleEntity",
        labelName: "SimpleEntity",
      };

      const result = generateMetaFile(meta);

      expect(result).toContain("export const simpleEntityMeta: DataMeta = {");
      expect(result).toContain('type: "simple-entities"');
    });
  });

  describe("generateEntityFile", () => {
    it("should generate entity file with defineEntity", () => {
      const parsed = getParsedTestEntity();
      const entityDir = path.join(FIXTURES_DIR, "entities");

      const result = generateEntityFile(parsed, entityDir);

      expect(result).toContain("defineEntity<TestEntity>()");
    });

    it("should generate complete file structure", () => {
      const parsed = getParsedTestEntity();
      const entityDir = path.join(FIXTURES_DIR, "entities");

      const result = generateEntityFile(parsed, entityDir);

      // Should have imports first
      expect(result.indexOf("import")).toBeLessThan(result.indexOf("export type TestEntity"));

      // Should have type definition before descriptor
      expect(result.indexOf("export type TestEntity")).toBeLessThan(result.indexOf("export const TestEntityDescriptor"));

      // Should have descriptor type export at end
      expect(result).toContain("export type TestEntityDescriptorType");
    });

    it("should include entity type definition", () => {
      const parsed = getParsedTestEntity();
      const entityDir = path.join(FIXTURES_DIR, "entities");

      const result = generateEntityFile(parsed, entityDir);

      expect(result).toContain("export type TestEntity = Entity & {");
      expect(result).toContain("name: string;");
      expect(result).toContain("description?: string;");
    });

    it("should generate valid file for simple-entity", () => {
      const parsed = getParsedSimpleEntity();
      const entityDir = path.join(FIXTURES_DIR, "simple-entity");

      const result = generateEntityFile(parsed, entityDir);

      expect(result).toContain("export const SimpleEntityDescriptor = defineEntity<SimpleEntity>()");
      expect(result).toContain("...simpleEntityMeta");
      expect(result).not.toContain("injectServices");
      expect(result).not.toContain("S3Service");
    });

    it("should generate valid file for complex-entity with relationships", () => {
      const parsed = getParsedComplexEntity();
      const entityDir = path.join(FIXTURES_DIR, "complex-entity");

      const result = generateEntityFile(parsed, entityDir);

      expect(result).toContain("export const ComplexEntityDescriptor = defineEntity<ComplexEntity>()");
      expect(result).toContain("relationships:");
      expect(result).toContain("author:");
      expect(result).toContain("company:");
      expect(result).toContain("items:");
    });
  });

  describe("S3 transform code generation", () => {
    it("should generate single URL transform correctly", () => {
      const parsed = getParsedTestEntity();
      const entityDir = path.join(FIXTURES_DIR, "entities");

      const result = generateDescriptor(parsed, entityDir);

      // Check for single URL transform pattern
      expect(result.code).toContain("if (!data.url) return undefined;");
      expect(result.code).toContain('return await services.S3Service.generateSignedUrl({ key: data.url });');
    });

    it("should generate array URL transform correctly", () => {
      const parsed = getParsedTestEntity();
      const entityDir = path.join(FIXTURES_DIR, "entities");

      const result = generateDescriptor(parsed, entityDir);

      // Check for array URL transform pattern
      expect(result.code).toContain("if (!data.samplePhotographs?.length) return [];");
      expect(result.code).toContain("data.samplePhotographs.map((url: string) => services.S3Service.generateSignedUrl({ key: url })");
    });
  });
});
