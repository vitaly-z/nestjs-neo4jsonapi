import { Injectable, Type } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ModuleRef } from "@nestjs/core";
import { mapEntity } from "../abstracts/entity";
import { DataModelInterface } from "../interfaces/datamodel.interface";
import {
  ComputedFieldDef,
  EntityDescriptor,
  EntitySchemaInput,
  FieldDef,
  RelationshipDef,
} from "../interfaces/entity.schema.interface";
import { BaseConfigInterface } from "../../config/interfaces";
import { JsonApiSerialiserFactory } from "../../core/jsonapi/factories/jsonapi.serialiser.factory";
import { DescriptorBasedSerialiser } from "../../core/jsonapi/serialisers/descriptor.based.serialiser";

/**
 * Create a unique serialiser class for an entity descriptor.
 * The class extends DescriptorBasedSerialiser and has the descriptor pre-configured.
 */
function createSerialiserForDescriptor<T, R extends Record<string, RelationshipDef>>(
  descriptor: EntityDescriptor<T, R>,
  labelName: string,
): Type<DescriptorBasedSerialiser> {
  @Injectable()
  class AutoSerialiser extends DescriptorBasedSerialiser {
    constructor(
      serialiserFactory: JsonApiSerialiserFactory,
      moduleRef: ModuleRef,
      configService: ConfigService<BaseConfigInterface>,
    ) {
      super(serialiserFactory, moduleRef, configService);
      this.setDescriptor(descriptor);
    }
  }

  // Give it a unique name for debugging and DI registration
  Object.defineProperty(AutoSerialiser, "name", {
    value: `${labelName}AutoSerialiser`,
    writable: false,
  });

  return AutoSerialiser;
}

/**
 * Define an entity descriptor using a clean, declarative schema
 *
 * This function takes a schema definition and computes all derived values:
 * - Extracts field names, string fields, required fields, and defaults
 * - Generates UNIQUE constraint for 'id'
 * - Generates FULLTEXT index from string fields
 * - Auto-generates mapper function from fields and computed definitions
 * - Derives childrenTokens from relationships
 * - Creates a complete DataModelInterface
 *
 * @template T - The entity type (e.g., Glossary)
 * @template R - The relationships record type for autocomplete support
 *
 * @example
 * ```typescript
 * export const GlossaryDescriptor = defineEntity<Glossary>()({
 *   type: "glossaries",
 *   endpoint: "glossaries",
 *   nodeName: "glossary",
 *   labelName: "Glossary",
 *
 *   fields: {
 *     name: { type: 'string', required: true },
 *     description: { type: 'string' },
 *     aiStatus: { type: 'string', default: AiStatus.Pending, meta: true },
 *   },
 *
 *   computed: {
 *     relevance: {
 *       compute: (params) => params.record.has("totalScore") ? Number(params.record.get("totalScore")) : 0,
 *       meta: true,
 *     },
 *   },
 *
 *   relationships: {
 *     author: { model: authorMeta, direction: 'in', relationship: 'PUBLISHED', cardinality: 'one' },
 *     topic: { model: topicMeta, direction: 'out', relationship: 'RELEVANT_FOR', cardinality: 'many' },
 *   },
 * });
 *
 * // Access with autocomplete:
 * GlossaryDescriptor.model // DataModelInterface with mapper, childrenTokens, etc.
 * GlossaryDescriptor.relationships.author
 * GlossaryDescriptor.fieldNames // ['name', 'description', 'aiStatus']
 * ```
 */
export function defineEntity<T>() {
  return function <R extends Record<string, RelationshipDef>>(schema: EntitySchemaInput<T, R>): EntityDescriptor<T, R> {
    const {
      type,
      endpoint,
      nodeName,
      labelName,
      fields,
      relationships,
      computed = {},
      serialiser: customSerialiser,
      injectServices = [],
      isCompanyScoped = true,
    } = schema;

    // Extract field information
    const fieldEntries = Object.entries(fields) as [string, FieldDef][];
    const fieldNames = fieldEntries.map(([name]) => name);

    // String fields for FULLTEXT index
    const stringFields = fieldEntries.filter(([, def]) => def.type === "string").map(([name]) => name);

    // Required fields
    const requiredFields = fieldEntries.filter(([, def]) => def.required === true).map(([name]) => name);

    // Default values
    const fieldDefaults: Record<string, any> = {};
    for (const [name, def] of fieldEntries) {
      if (def.default !== undefined) {
        fieldDefaults[name] = def.default;
      }
    }

    // Generate index name
    const fulltextIndexName = `${nodeName}_search_index`;

    // Build relationship keys for autocomplete (e.g., descriptor.relationshipKeys.author returns "author")
    const relationshipKeys = Object.keys(relationships).reduce(
      (acc, key) => {
        acc[key as keyof R] = key as keyof R;
        return acc;
      },
      {} as { [K in keyof R]: K },
    );

    // Derive childrenTokens from relationships
    // singleChildrenTokens: company (if scoped) + cardinality 'one' relationships
    // childrenTokens: cardinality 'many' relationships
    const singleChildrenTokens: string[] = isCompanyScoped ? ["company"] : [];
    const childrenTokens: string[] = [];

    for (const [, rel] of Object.entries(relationships)) {
      if (rel.cardinality === "one") {
        singleChildrenTokens.push(rel.model.nodeName);
      } else {
        childrenTokens.push(rel.model.nodeName);
      }
    }

    // Auto-generate mapper function from fields and computed definitions
    const mapper = (params: { data: any; record: any; entityFactory: any; name?: string }): T => {
      const result: any = {
        ...mapEntity({ record: params.data }),
      };

      // Map fields from data
      for (const fieldName of fieldNames) {
        result[fieldName] = params.data[fieldName];
      }

      // Evaluate computed fields
      for (const [fieldName, def] of Object.entries(computed) as [string, ComputedFieldDef][]) {
        result[fieldName] = def.compute(params);
      }

      // Initialize relationship placeholders
      if (isCompanyScoped) {
        result.company = undefined;
      }
      for (const [name, rel] of Object.entries(relationships)) {
        result[name] = rel.cardinality === "many" ? [] : undefined;
      }

      return result as T;
    };

    // Build descriptor first (without model and serialiser)
    const descriptor: EntityDescriptor<T, R> = {
      model: undefined as unknown as DataModelInterface<T>, // Will be set below
      isCompanyScoped,
      relationships,
      relationshipKeys,

      // Computed from fields
      fieldNames,
      stringFields,
      requiredFields,
      fieldDefaults,
      fields: fields as { [K in keyof Partial<T>]?: FieldDef },
      computed: computed as { [K in keyof Partial<T>]?: ComputedFieldDef },
      injectServices,

      // Auto-generated database config
      constraints: [{ property: "id", type: "UNIQUE" }],

      indexes:
        stringFields.length > 0
          ? [
              {
                name: fulltextIndexName,
                properties: stringFields,
                type: "FULLTEXT",
              },
            ]
          : [],

      fulltextIndexName: stringFields.length > 0 ? fulltextIndexName : "",
      defaultOrderBy: "updatedAt DESC",
    };

    // Auto-generate serialiser if not provided
    const serialiserClass = customSerialiser || createSerialiserForDescriptor(descriptor, labelName);

    // Create DataModelInterface with serialiser
    const model: DataModelInterface<T> = {
      type,
      endpoint,
      nodeName,
      labelName,
      entity: undefined as unknown as T,
      mapper,
      serialiser: serialiserClass,
      singleChildrenTokens,
      childrenTokens,
    };

    // Assign model to descriptor
    descriptor.model = model;

    return descriptor;
  };
}
