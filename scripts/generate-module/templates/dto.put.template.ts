import { TemplateData, DescriptorRelationship, DTOField } from "../types/template-data.interface";
import { isFoundationImport, FOUNDATION_PACKAGE, resolveNewDtoImportPath, resolveDtoImportPath } from "../transformers/import-resolver";
import { getValidationImports, getValidationDecorators, CypherType } from "../utils/type-utils";

/**
 * Get the import path for a relationship's DTO
 */
function getDtoImportPath(rel: DescriptorRelationship, fromDir: string, fromModule: string): string {
  if (rel.isNewStructure) {
    // NEW structure: use absolute path from src
    return resolveNewDtoImportPath({
      directory: rel.relatedEntity.directory,
      moduleName: rel.relatedEntity.kebabCase,
    });
  } else {
    // OLD structure: foundation or relative path with proper resolution
    return isFoundationImport(rel.relatedEntity.directory)
      ? FOUNDATION_PACKAGE
      : resolveDtoImportPath({
          fromDir,
          fromModule,
          toDir: rel.relatedEntity.directory,
          toModule: rel.relatedEntity.kebabCase,
        });
  }
}

/**
 * Generate PUT DTO file content
 * Same as POST but excludes contextKey relationships (like Author)
 *
 * @param data - Template data
 * @returns Generated TypeScript code
 */
export function generatePutDTOFile(data: TemplateData): string {
  const { names, targetDir, fields, relationships, dtoFields } = data;

  // Build DTO imports for relationships (excluding contextKey)
  const dtoImportPaths = new Map<string, Set<string>>();

  for (const rel of relationships) {
    // Skip contextKey relationships (like Author) - same as POST
    if (rel.contextKey) continue;

    const importPath = getDtoImportPath(rel, targetDir, names.kebabCase);

    if (!dtoImportPaths.has(importPath)) {
      dtoImportPaths.set(importPath, new Set());
    }

    // Add both singular and list DTOs
    dtoImportPaths.get(importPath)!.add(`${rel.relatedEntity.name}DataDTO`);
    if (rel.cardinality === "many") {
      dtoImportPaths.get(importPath)!.add(`${rel.relatedEntity.name}DataListDTO`);
    }
  }

  const dtoImportsCode =
    dtoImportPaths.size > 0
      ? `\n${Array.from(dtoImportPaths.entries())
          .map(([path, items]) => `import { ${Array.from(items).join(", ")} } from "${path}";`)
          .join("\n")}\n`
      : "";

  // Collect relationship property fields (from cardinality: "one" relationships, excluding contextKey)
  const relPropertyFields: DTOField[] = [];
  const relPropertyTypes: CypherType[] = [];

  for (const rel of relationships) {
    if (rel.fields && rel.fields.length > 0 && !rel.contextKey && rel.cardinality === "one") {
      for (const field of rel.fields) {
        const fieldType = field.type as CypherType;
        relPropertyTypes.push(fieldType);
        relPropertyFields.push({
          name: field.name,
          type: field.tsType,
          isOptional: !field.required,
          decorators: getValidationDecorators(fieldType, field.required),
        });
      }
    }
  }

  // Combine regular fields with relationship property fields
  const allDtoFields = [...dtoFields, ...relPropertyFields];

  // Build attribute validation using combined fields (same as POST)
  const attributeFields = allDtoFields
    .map((field) => {
      const optional = field.isOptional ? "?" : "";
      return `  ${field.decorators.join("\n  ")}\n  ${field.name}${optional}: ${field.type};`;
    })
    .join("\n\n");

  // Get dynamic validator imports based on all field types (including relationship properties)
  const fieldTypes = [...fields.map((f) => f.type as CypherType), ...relPropertyTypes];
  const validatorImports = getValidationImports(fieldTypes);

  // Build relationship validation (exclude contextKey - same as POST)
  const relationshipFields = relationships
    .filter((rel) => !rel.contextKey) // Exclude Author and other contextKey relationships
    .map((rel) => {
      const decorators = [];
      const dtoClass =
        rel.cardinality === "many" ? `${rel.relatedEntity.name}DataListDTO` : `${rel.relatedEntity.name}DataDTO`;

      if (rel.cardinality === "many") {
        decorators.push("@ValidateNested({ each: true })");
      } else {
        decorators.push("@ValidateNested()");
      }

      if (rel.nullable) {
        decorators.push("@IsOptional()");
      } else {
        decorators.push("@IsDefined()");
      }

      decorators.push(`@Type(() => ${dtoClass})`);

      const optional = rel.nullable ? "?" : "";
      const dtoKey = rel.dtoKey || rel.key;
      return `  ${decorators.join("\n  ")}\n  ${dtoKey}${optional}: ${dtoClass};`;
    })
    .join("\n\n");

  return `import { Type } from "class-transformer";
import { ${validatorImports.join(", ")} } from "class-validator";${dtoImportsCode}
import { ${names.camelCase}Meta } from "src/${targetDir}/${names.kebabCase}/entities/${names.kebabCase}.meta";

export class ${names.pascalCase}PutAttributesDTO {
${attributeFields}
}

export class ${names.pascalCase}PutRelationshipsDTO {
${relationshipFields || "  // No relationships (excluding contextKey relationships)"}
}

export class ${names.pascalCase}PutDataDTO {
  @Equals(${names.camelCase}Meta.endpoint)
  type: string;

  @IsUUID()
  id: string;

  @ValidateNested()
  @IsNotEmpty()
  @Type(() => ${names.pascalCase}PutAttributesDTO)
  attributes: ${names.pascalCase}PutAttributesDTO;

  @ValidateNested()
  @IsNotEmpty()
  @Type(() => ${names.pascalCase}PutRelationshipsDTO)
  relationships: ${names.pascalCase}PutRelationshipsDTO;
}

export class ${names.pascalCase}PutDTO {
  @ValidateNested()
  @IsNotEmpty()
  @Type(() => ${names.pascalCase}PutDataDTO)
  data: ${names.pascalCase}PutDataDTO;
}
`;
}
