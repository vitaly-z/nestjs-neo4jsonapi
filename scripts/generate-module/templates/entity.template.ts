import { TemplateData, DescriptorRelationship } from "../types/template-data.interface";
import { isFoundationImport, FOUNDATION_PACKAGE } from "../transformers/import-resolver";

/**
 * Get the OLD structure entity import path
 */
function getOldEntityImportPath(rel: DescriptorRelationship): string {
  return isFoundationImport(rel.relatedEntity.directory)
    ? FOUNDATION_PACKAGE
    : `../../${rel.relatedEntity.directory}/${rel.relatedEntity.kebabCase}/entities/${rel.relatedEntity.kebabCase}.entity`;
}

/**
 * Get the OLD structure meta import path
 */
function getOldMetaImportPath(rel: DescriptorRelationship): string {
  return isFoundationImport(rel.relatedEntity.directory)
    ? FOUNDATION_PACKAGE
    : `../../${rel.relatedEntity.directory}/${rel.relatedEntity.kebabCase}/entities/${rel.relatedEntity.kebabCase}.meta`;
}

/**
 * Generate entity file content (Type + Descriptor)
 *
 * This is the most critical file - it defines both the TypeScript type
 * and the descriptor using defineEntity()
 *
 * @param data - Template data
 * @returns Generated TypeScript code
 */
export function generateEntityFile(data: TemplateData): string {
  const { names, endpoint, nodeName, labelName, fields, relationships } = data;

  // Build imports
  const libraryImports = ["defineEntity", "Entity"];
  if (data.isCompanyScoped) {
    libraryImports.push("Company");
  }

  // Separate OLD and NEW structure relationships
  const oldStructureRels = relationships.filter((rel) => !rel.isNewStructure);
  const newStructureRels = relationships.filter((rel) => rel.isNewStructure);

  // OLD structure: entity imports (grouped by path)
  const oldEntityImportsByPath = new Map<string, string[]>();
  const processedOldEntities = new Set<string>();

  for (const rel of oldStructureRels) {
    if (!processedOldEntities.has(rel.relatedEntity.name)) {
      processedOldEntities.add(rel.relatedEntity.name);
      const importPath = getOldEntityImportPath(rel);
      if (!oldEntityImportsByPath.has(importPath)) {
        oldEntityImportsByPath.set(importPath, []);
      }
      oldEntityImportsByPath.get(importPath)!.push(rel.relatedEntity.name);
    }
  }

  // OLD structure: meta imports (grouped by path)
  const oldMetaImportsByPath = new Map<string, string[]>();
  const processedOldMetas = new Set<string>();

  for (const rel of oldStructureRels) {
    // For OLD structure, model is like "userMeta" or "ownerMeta"
    if (!processedOldMetas.has(rel.model)) {
      processedOldMetas.add(rel.model);
      const importPath = getOldMetaImportPath(rel);
      if (!oldMetaImportsByPath.has(importPath)) {
        oldMetaImportsByPath.set(importPath, []);
      }
      oldMetaImportsByPath.get(importPath)!.push(rel.model);
    }
  }

  // NEW structure: combined entity + descriptor imports (grouped by path)
  const newImportsByPath = new Map<string, string[]>();
  const processedNewEntities = new Set<string>();

  for (const rel of newStructureRels) {
    if (!processedNewEntities.has(rel.relatedEntity.name) && rel.importPath && rel.descriptorName) {
      processedNewEntities.add(rel.relatedEntity.name);
      if (!newImportsByPath.has(rel.importPath)) {
        newImportsByPath.set(rel.importPath, []);
      }
      // Import both entity type and Descriptor for NEW structure
      newImportsByPath.get(rel.importPath)!.push(rel.relatedEntity.name, rel.descriptorName);
    }
  }

  // Build field definitions for descriptor
  const fieldDefinitions = fields
    .map((field) => {
      const parts: string[] = [];
      parts.push(`type: "${field.type}"`);
      if (field.required) {
        parts.push(`required: true`);
      }
      return `    ${field.name}: { ${parts.join(", ")} },`;
    })
    .join("\n");

  // Build relationship definitions for descriptor
  const relationshipDefinitions = relationships
    .map((rel) => {
      const parts: string[] = [];
      parts.push(`model: ${rel.model}`);
      parts.push(`direction: "${rel.direction}"`);
      parts.push(`relationship: "${rel.relationship}"`);
      parts.push(`cardinality: "${rel.cardinality}"`);

      if (rel.contextKey) {
        parts.push(`contextKey: "${rel.contextKey}"`);
      }
      if (rel.dtoKey) {
        parts.push(`dtoKey: "${rel.dtoKey}"`);
      }

      return `    ${rel.key}: {\n      ${parts.join(",\n      ")},\n    },`;
    })
    .join("\n");

  // Build all import lines
  const importLines: string[] = [];

  // Library imports (always first)
  importLines.push(`import { ${libraryImports.join(", ")} } from "@carlonicora/nestjs-neo4jsonapi";`);

  // OLD structure entity imports
  for (const [path, items] of oldEntityImportsByPath.entries()) {
    importLines.push(`import { ${items.join(", ")} } from "${path}";`);
  }

  // OLD structure meta imports
  for (const [path, items] of oldMetaImportsByPath.entries()) {
    importLines.push(`import { ${items.join(", ")} } from "${path}";`);
  }

  // NEW structure combined imports (entity + descriptor)
  for (const [path, items] of newImportsByPath.entries()) {
    importLines.push(`import { ${items.join(", ")} } from "${path}";`);
  }

  return `${importLines.join("\n")}

/**
 * ${names.pascalCase} Entity Type
 */
export type ${names.pascalCase} = Entity & {
${fields
  .map((field) => {
    const optional = !field.required ? "?" : "";
    return `  ${field.name}${optional}: ${field.tsType};`;
  })
  .join("\n")}

${data.isCompanyScoped ? "  company: Company;\n" : ""}${relationships
  .map((rel) => {
    const optional = rel.nullable ? "?" : "";
    const type = rel.cardinality === "many" ? `${rel.relatedEntity.name}[]` : rel.relatedEntity.name;
    return `  ${rel.key}${optional}: ${type};`;
  })
  .join("\n")}
};

/**
 * ${names.pascalCase} Entity Descriptor
 *
 * Single source of truth for the ${names.pascalCase} entity configuration.
 * Auto-generates mapper, serialiser, constraints, and indexes.
 */
export const ${names.pascalCase}Descriptor = defineEntity<${names.pascalCase}>()({
  type: "${endpoint}",
  endpoint: "${endpoint}",
  nodeName: "${nodeName}",
  labelName: "${labelName}",
${!data.isCompanyScoped ? "\n  isCompanyScoped: false,\n" : ""}
  fields: {
${fieldDefinitions}
  },

  relationships: {
${relationshipDefinitions}
  },
});

export type ${names.pascalCase}DescriptorType = typeof ${names.pascalCase}Descriptor;
`;
}
