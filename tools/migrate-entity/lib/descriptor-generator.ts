/**
 * Entity Migration CLI - Descriptor Generator Module
 *
 * Generates new-style descriptor code from parsed entity data.
 */

import * as path from "path";
import { findAndParseCypherRelationships } from "./ast-parser";
import {
  ComputedConfig,
  CypherRelationship,
  FieldConfig,
  GeneratedDescriptor,
  ParsedEntity,
  RelationshipConfig,
} from "./types";

export interface GeneratorOptions {
  /** Path to the module directory for Cypher relationship extraction */
  modulePath?: string;
  /** Whether to use Cypher relationships instead of heuristics */
  useCypherRelationships?: boolean;
  /** Enable verbose logging */
  verbose?: boolean;
}

/**
 * Generates the new descriptor code from parsed entity data.
 */
export function generateDescriptor(
  parsed: ParsedEntity,
  entityDir: string,
  options: GeneratorOptions = {}
): GeneratedDescriptor {
  const { meta, entityType, mapper, serialiser } = parsed;

  // Try to extract relationships from Cypher queries if module path provided
  let cypherRelationships: CypherRelationship[] = [];
  if (options.useCypherRelationships !== false && options.modulePath) {
    cypherRelationships = findAndParseCypherRelationships(options.modulePath, meta.nodeName);
    if (options.verbose && cypherRelationships.length > 0) {
      console.log(`  Found ${cypherRelationships.length} relationships from Cypher queries:`);
      for (const rel of cypherRelationships) {
        console.log(`    - ${rel.name}: ${rel.direction === "in" ? "<-" : ""}[:${rel.relationshipType}]${rel.direction === "out" ? "->" : ""} ${rel.relatedLabel}`);
      }
    }
  }

  // Build field configs
  const fields = buildFieldConfigs(entityType, serialiser, mapper);

  // Build computed configs
  const computed = buildComputedConfigs(mapper, serialiser);

  // Build relationship configs using Cypher relationships when available
  const relationships = buildRelationshipConfigs(serialiser, cypherRelationships, options.verbose);

  // Generate imports
  const imports = generateImports(parsed, relationships, entityDir);

  // Generate the descriptor code
  const code = generateDescriptorCode(meta, entityType.name, fields, computed, relationships);

  return { code, imports };
}

/**
 * Builds field configurations from entity type, serialiser, and mapper.
 */
function buildFieldConfigs(
  entityType: ParsedEntity["entityType"],
  serialiser: ParsedEntity["serialiser"],
  mapper: ParsedEntity["mapper"]
): FieldConfig[] {
  const fields: FieldConfig[] = [];

  // Get attribute names from serialiser (these are JSON:API attributes)
  const attributeNames = new Set(serialiser?.attributes.map((a) => a.name) || []);

  // Get meta names from serialiser (these go to meta)
  const metaNames = new Set(serialiser?.meta.map((m) => m.name) || []);

  // Get mapper field names for mapping
  const mapperFields = new Map(mapper?.fields.filter((f) => !f.isComputed).map((f) => [f.name, f]) || []);

  // Process entity type fields
  for (const field of entityType.fields) {
    // Skip if this is a computed field (handled separately)
    const mapperField = mapperFields.get(field.name);
    if (mapper?.fields.some((f) => f.name === field.name && f.isComputed)) {
      continue;
    }

    // Determine if it's a meta field
    const isMeta = metaNames.has(field.name);

    // Determine if it's required (not optional and not a meta field)
    const isRequired = !field.optional && attributeNames.has(field.name);

    // Determine type (cypher type)
    const cypherType = mapToCypherType(field.type);

    // Check for default values (e.g., aiStatus)
    const defaultValue = getDefaultValue(field.name, mapper);

    fields.push({
      name: field.name,
      type: cypherType,
      required: isRequired,
      default: defaultValue,
      meta: isMeta,
    });
  }

  return fields;
}

/**
 * Builds computed field configurations from mapper.
 */
function buildComputedConfigs(
  mapper: ParsedEntity["mapper"],
  serialiser: ParsedEntity["serialiser"]
): ComputedConfig[] {
  const computed: ComputedConfig[] = [];

  if (!mapper) return computed;

  // Get meta names from serialiser
  const metaNames = new Set(serialiser?.meta.map((m) => m.name) || []);

  for (const field of mapper.fields.filter((f) => f.isComputed)) {
    computed.push({
      name: field.name,
      compute: field.mapping,
      meta: metaNames.has(field.name),
    });
  }

  return computed;
}

/**
 * Builds relationship configurations from serialiser, using Cypher relationships when available.
 */
function buildRelationshipConfigs(
  serialiser: ParsedEntity["serialiser"],
  cypherRelationships: CypherRelationship[] = [],
  verbose?: boolean
): RelationshipConfig[] {
  const relationships: RelationshipConfig[] = [];

  if (!serialiser) return relationships;

  // Create a map of Cypher relationships by name for quick lookup
  const cypherMap = new Map<string, CypherRelationship>();
  for (const rel of cypherRelationships) {
    cypherMap.set(rel.name, rel);
  }

  for (const rel of serialiser.relationships) {
    // Convert Model name to meta name (e.g., UserModel -> userMeta, authorMeta)
    const modelMeta = modelToMetaName(rel.name, rel.modelImport);

    // Check if we have Cypher-extracted relationship info
    const cypherRel = cypherMap.get(rel.name);

    let direction: "in" | "out";
    let relationship: string;
    let contextKey: string | undefined;

    if (cypherRel) {
      // Use Cypher-extracted values (from actual database queries)
      direction = cypherRel.direction;
      relationship = cypherRel.relationshipType;
      // Keep contextKey heuristic for author relationship
      contextKey = rel.name === "author" ? "userId" : undefined;

      if (verbose) {
        console.log(`    Using Cypher for '${rel.name}': ${direction === "in" ? "<-" : ""}[:${relationship}]${direction === "out" ? "->" : ""}`);
      }
    } else {
      // Fall back to heuristics when no Cypher info available
      const inferred = inferRelationshipDetails(rel.name);
      direction = inferred.direction;
      relationship = inferred.relationship;
      contextKey = inferred.contextKey;

      if (verbose) {
        console.log(`    Using heuristic for '${rel.name}': ${direction === "in" ? "<-" : ""}[:${relationship}]${direction === "out" ? "->" : ""} (no Cypher match)`);
      }
    }

    // Determine cardinality from dtoKey (plural = many)
    const cardinality = rel.dtoKey && rel.dtoKey.endsWith("s") ? "many" : "one";

    relationships.push({
      name: rel.name,
      model: modelMeta,
      direction,
      relationship,
      cardinality,
      dtoKey: rel.dtoKey,
      contextKey,
    });
  }

  return relationships;
}

/**
 * Maps TypeScript type to Cypher type.
 */
function mapToCypherType(tsType: string): string {
  const typeMap: Record<string, string> = {
    string: "string",
    number: "number",
    boolean: "boolean",
    Date: "date",
  };

  return typeMap[tsType] || "string";
}

/**
 * Gets default value for a field if known.
 */
function getDefaultValue(fieldName: string, mapper: ParsedEntity["mapper"]): string | undefined {
  // Known defaults
  const knownDefaults: Record<string, string> = {
    aiStatus: "AiStatus.Pending",
  };

  return knownDefaults[fieldName];
}

/**
 * Converts Model import name to meta variable name.
 */
function modelToMetaName(relName: string, modelImport: string): string {
  // Special cases
  if (relName === "author") return "authorMeta";
  if (relName === "user" || relName === "editors") return "userMeta";

  // General case: UserModel -> userMeta
  const baseName = modelImport.replace("Model", "").toLowerCase();
  return `${baseName}Meta`;
}

/**
 * Infers relationship details based on relationship name.
 */
function inferRelationshipDetails(relName: string): {
  direction: "in" | "out";
  relationship: string;
  contextKey?: string;
} {
  // Known patterns
  const patterns: Record<string, { direction: "in" | "out"; relationship: string; contextKey?: string }> = {
    author: { direction: "in", relationship: "PUBLISHED", contextKey: "userId" },
    user: { direction: "out", relationship: "ACCESSIBLE_BY" },
    topic: { direction: "out", relationship: "RELEVANT_FOR" },
    expertise: { direction: "out", relationship: "RELEVANT_FOR" },
    company: { direction: "out", relationship: "BELONGS_TO" },
  };

  return patterns[relName] || { direction: "out", relationship: "RELATED_TO" };
}

/**
 * Generates import statements for the descriptor.
 */
function generateImports(
  parsed: ParsedEntity,
  relationships: RelationshipConfig[],
  entityDir: string
): string[] {
  const imports: string[] = [];

  // Always needed imports - use package imports
  imports.push(`import { Entity } from "@carlonicora/nestjs-neo4jsonapi/common";`);
  imports.push(`import { defineEntity } from "@carlonicora/nestjs-neo4jsonapi/common";`);

  // Check if AiStatus is needed
  const hasAiStatus = parsed.entityType.fields.some((f) => f.name === "aiStatus");
  if (hasAiStatus) {
    imports.push(`import { AiStatus } from "src/common/enums/ai.status";`);
  }

  // Add relationship model imports (keep original imports for related entity types)
  const relatedEntities = new Set<string>();
  for (const rel of relationships) {
    // Extract the meta import path from original serialiser imports
    const metaImport = findMetaImport(parsed, rel.model);
    if (metaImport) {
      imports.push(metaImport);
    }
  }

  // Add entity type imports from original entity file (for relationship types like Company, User, Topic, etc.)
  for (const imp of parsed.entityType.imports) {
    // Include imports that reference entity types used in the type definition
    if (
      imp.includes("/entities/") &&
      (imp.includes(".entity") || !imp.includes(".meta") && !imp.includes(".model") && !imp.includes(".map"))
    ) {
      imports.push(imp);
    }
  }

  return [...new Set(imports)]; // Remove duplicates
}

/**
 * Finds the meta import statement for a given meta name.
 */
function findMetaImport(parsed: ParsedEntity, metaName: string): string | null {
  // Check serialiser imports
  if (parsed.serialiser) {
    for (const imp of parsed.serialiser.imports) {
      if (imp.includes(`.meta"`) || imp.includes(`.meta'`)) {
        // Check if this import contains the meta we're looking for
        const importMatch = imp.match(/import\s*\{([^}]+)\}/);
        if (importMatch) {
          const importedNames = importMatch[1].split(",").map((s) => s.trim());
          if (importedNames.includes(metaName)) {
            // Return just this import
            return imp.replace(/import\s*\{[^}]+\}/, `import { ${metaName} }`);
          }
        }
      }
    }
  }

  // Fallback: construct import from meta name
  const baseName = metaName.replace("Meta", "");
  if (baseName === "author" || baseName === "user") {
    return `import { ${metaName} } from "src/foundations/user/entities/user.meta";`;
  }
  if (baseName === "topic") {
    return `import { ${metaName} } from "src/features/topic/entities/topic.meta";`;
  }
  if (baseName === "expertise") {
    return `import { ${metaName} } from "src/features/expertise/entities/expertise.meta";`;
  }
  if (baseName === "company") {
    return `import { ${metaName} } from "src/foundations/company/entities/company.meta";`;
  }

  return null;
}

/**
 * Generates the complete descriptor code.
 */
function generateDescriptorCode(
  meta: ParsedEntity["meta"],
  entityName: string,
  fields: FieldConfig[],
  computed: ComputedConfig[],
  relationships: RelationshipConfig[]
): string {
  const descriptorName = `${meta.labelName}Descriptor`;

  let code = `
/**
 * ${meta.labelName} Entity Descriptor
 *
 * Single source of truth for the ${meta.labelName} entity configuration.
 * Generates mapper, childrenTokens, and DataModelInterface automatically.
 */
export const ${descriptorName} = defineEntity<${entityName}>()({
  // Meta properties
  type: "${meta.type}",
  endpoint: "${meta.endpoint}",
  nodeName: "${meta.nodeName}",
  labelName: "${meta.labelName}",
`;

  // Add fields
  if (fields.length > 0) {
    code += `
  // Field definitions
  fields: {
`;
    for (const field of fields) {
      code += `    ${field.name}: { type: "${field.type}"`;
      if (field.required) code += `, required: true`;
      if (field.default) code += `, default: ${field.default}`;
      if (field.meta) code += `, meta: true`;
      code += ` },\n`;
    }
    code += `  },
`;
  }

  // Add computed fields
  if (computed.length > 0) {
    code += `
  // Computed fields
  computed: {
`;
    for (const comp of computed) {
      code += `    ${comp.name}: {\n`;
      code += `      compute: (params) => ${comp.compute},\n`;
      if (comp.meta) code += `      meta: true,\n`;
      code += `    },\n`;
    }
    code += `  },
`;
  }

  // Add relationships
  if (relationships.length > 0) {
    code += `
  // Relationship definitions
  relationships: {
`;
    for (const rel of relationships) {
      code += `    ${rel.name}: {\n`;
      code += `      model: ${rel.model},\n`;
      code += `      direction: "${rel.direction}",\n`;
      code += `      relationship: "${rel.relationship}",\n`;
      code += `      cardinality: "${rel.cardinality}",\n`;
      if (rel.contextKey) code += `      contextKey: "${rel.contextKey}",\n`;
      if (rel.dtoKey) code += `      dtoKey: "${rel.dtoKey}",\n`;
      code += `    },\n`;
    }
    code += `  },
`;
  }

  code += `});

// Type export for the descriptor
export type ${descriptorName}Type = typeof ${descriptorName};
`;

  return code;
}

/**
 * Generates the complete new entity file content.
 */
export function generateEntityFile(
  parsed: ParsedEntity,
  entityDir: string,
  options: GeneratorOptions = {}
): string {
  const descriptor = generateDescriptor(parsed, entityDir, options);

  // Start with imports
  let content = descriptor.imports.join("\n") + "\n\n";

  // Add the entity type definition (keep from original)
  content += generateEntityTypeDefinition(parsed);
  content += "\n";

  // Add the descriptor
  content += descriptor.code;

  return content;
}

/**
 * Generates the entity type definition from parsed data.
 */
function generateEntityTypeDefinition(parsed: ParsedEntity): string {
  const { entityType, meta } = parsed;

  let code = `/**
 * ${meta.labelName} Entity Type
 */
export type ${entityType.name} = Entity & {\n`;

  // Add scalar fields
  for (const field of entityType.fields) {
    const optional = field.optional ? "?" : "";
    code += `  ${field.name}${optional}: ${field.type};\n`;
  }

  // Add blank line before relationship fields if both exist
  if (entityType.fields.length > 0 && entityType.relationshipFields.length > 0) {
    code += `\n`;
  }

  // Add relationship fields (Company, User, Topic[], etc.)
  for (const field of entityType.relationshipFields) {
    const optional = field.optional ? "?" : "";
    code += `  ${field.name}${optional}: ${field.type};\n`;
  }

  code += `};\n`;

  return code;
}
