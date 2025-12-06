# Entity Migration CLI

Migrates old-style entities (5 files per entity) to the new descriptor-based architecture (1 file per entity).

## Old Pattern (5 files)

```
feature/entities/
├── entity.ts           # Type definition only
├── entity.meta.ts      # Meta object (type, endpoint, nodeName, labelName)
├── entity.model.ts     # DataModelInterface (combines meta + mapper + serialiser)
├── entity.map.ts       # Mapper function (Neo4j record → entity)
└── entity.serialiser.ts # JSON:API serialiser
```

## New Pattern (1 file)

```
feature/entities/
└── entity.ts           # Type + Descriptor (generates everything)
```

## Usage

```bash
# From your project's root directory:

# Migrate a single module by path
pnpm neo4jsonapi-migrate --path src/features/article

# Migrate a foundation module
pnpm neo4jsonapi-migrate --path src/foundations/user

# Migrate a specific entity in a multi-entity module
pnpm neo4jsonapi-migrate --path src/foundations/auth --entity auth.code

# Migrate all entities in the codebase
pnpm neo4jsonapi-migrate --all

# Dry run (preview changes without writing files)
pnpm neo4jsonapi-migrate --path src/features/article --dry-run

# Verbose output
pnpm neo4jsonapi-migrate --path src/features/article --verbose
```

## CLI Options

| Flag                       | Description                                            |
| -------------------------- | ------------------------------------------------------ |
| `-p, --path <module-path>` | Path to module folder (e.g., `src/features/article`)   |
| `-e, --entity <name>`      | Entity name if module has multiple (e.g., `auth.code`) |
| `-a, --all`                | Migrate all entities in codebase                       |
| `-d, --dry-run`            | Preview changes without writing files                  |
| `--skip-backup`            | Skip creating .bak backup files                        |
| `-v, --verbose`            | Show detailed output                                   |

## What the Migration Does

1. **Parses old files**: Reads meta, entity type, mapper, and serialiser files
2. **Generates descriptor**: Creates a new `defineEntity()` descriptor combining all configuration
3. **Updates external references**: Finds and updates all files that import the old exports
4. **Updates module file**: Changes providers and registry calls to use the descriptor
5. **Deletes old files**: Removes the now-redundant meta, model, map, and serialiser files

## Reference Transformations

### Import Changes

| Old                                                | New                                               |
| -------------------------------------------------- | ------------------------------------------------- |
| `import { articleMeta } from ".../article.meta"`   | `import { ArticleDescriptor } from ".../article"` |
| `import { ArticleModel } from ".../article.model"` | `import { ArticleDescriptor } from ".../article"` |

### Usage Changes

| Old                                      | New                                                 |
| ---------------------------------------- | --------------------------------------------------- |
| `articleMeta.labelName`                  | `ArticleDescriptor.model.labelName`                 |
| `ArticleModel.mapper`                    | `ArticleDescriptor.model.mapper`                    |
| `ArticleModel.serialiser`                | `ArticleDescriptor.model.serialiser`                |
| `serialiserFactory.create(ArticleModel)` | `serialiserFactory.create(ArticleDescriptor.model)` |
| `modelRegistry.register(ArticleModel)`   | `modelRegistry.register(ArticleDescriptor.model)`   |

## Edge Cases

### Entities Without Serialisers

Some entities (TokenUsage, AtomicFact, KeyConcept, Push) don't have serialisers. The migration handles these by generating a descriptor without relationship info.

### Custom Serialiser Logic

Entities with custom serialiser logic (like S3 URL signing in DocumentSerialiser) should be reviewed after migration. You may need to add `injectServices` and `transform` properties to the descriptor.

### Already Migrated Entities

The tool detects entities that have already been migrated (contain `defineEntity<`) and skips them.

## Troubleshooting

### TypeScript Errors After Migration

Run `pnpm build` to check for any remaining TypeScript errors. Common issues:

- Missing imports in the new descriptor file
- Relationship model references that need updating
- Custom computed field logic that needs adjustment

### Reverting Changes

If you didn't use `--skip-backup`, look for `.bak` files to restore:

```bash
# Restore from backup
mv src/features/article/entities/article.ts.bak src/features/article/entities/article.ts
```

## Phase 2: Repository & Service Migration

After the entity migration completes, you need to migrate the repository and service to use `AbstractRepository` and `AbstractService`.

### Migration Guide

See [MIGRATION-GUIDE.md](./MIGRATION-GUIDE.md) for detailed instructions on how to:

- Transform repositories to extend `AbstractRepository`
- Transform services to extend `AbstractService`
- Identify which methods to delete (inherited) vs keep (domain-specific)
- Update controller calls from `findByX()` to `findByRelated()`

### Claude Code Prompt

Use this prompt in a fresh Claude Code chat to migrate the repository and service:

```
I need you to migrate the repository and service for the {module} module to the new descriptor-based architecture.

## STOP - READ THE MANDATORY CHECKLIST FIRST

Open node_modules/@carlonicora/nestjs-neo4jsonapi/tools/migrate-entity/MIGRATION-GUIDE.md and complete the MANDATORY CHECKLIST at the top of the file.

## BEFORE making any edits:

1. Read the MANDATORY CHECKLIST in MIGRATION-GUIDE.md (at the very top)
2. Read the WRONG vs CORRECT examples in MIGRATION-GUIDE.md (immediately after checklist)
3. Read node_modules/@carlonicora/nestjs-neo4jsonapi/src/core/neo4j/abstracts/abstract.repository.ts - understand what methods are inherited
4. Read node_modules/@carlonicora/nestjs-neo4jsonapi/@carlonicora/nestjs-neo4jsonapi.ts - understand what methods are inherited
5. Read the current repository at src/features/{module}/repositories/
6. Read the current service at src/features/{module}/services/

## IF cypher.service.ts exists:

7. Read the cypher.service.ts at src/features/{module}/services/
8. SEARCH THE ENTIRE CODEBASE: grep -r "{Entity}CypherService" src/
   - If OTHER modules call it → the returnStatement logic is NOT dead code
   - Example: relevancy module calls document's cypher service
9. If returnStatement() has parameters or computed expressions:
   - Plan to override buildReturnStatement() in repository
   - DO NOT just delete cypher.service.ts without migrating

## ABSOLUTE RULES (violations = failed migration):

- createFromDTO ALREADY reads from DTO - you DO NOT need a wrapper method
- contextKey is a CLS fallback - NOT required if DTO has the relationship
- DO NOT rename methods - create() stays create(), never createDocument()
- DO NOT create wrapper methods that just map DTO fields
- If a service method ONLY does DTO mapping → DELETE it entirely

## Implementation Order:

1. Fix descriptor relationships if they don't match Cypher (FIRST)
2. Override buildReturnStatement() in repository if cypher.service.ts has custom logic
3. Migrate the repository to extend AbstractRepository
4. Migrate the service to extend AbstractService
5. Update controller calls to use findByRelated()
6. Delete cypher.service.ts (ONLY after logic is migrated)
7. Run pnpm build && pnpm lint

The entity has already been migrated - the {EntityName}Descriptor exists.
```

---

## Architecture

The CLI is built with the following modules:

| Module                        | Purpose                       |
| ----------------------------- | ----------------------------- |
| `index.ts`                    | CLI entry point               |
| `lib/entity-migrator.ts`      | Main orchestrator             |
| `lib/file-discovery.ts`       | Discovers old entity files    |
| `lib/ast-parser.ts`           | Parses TypeScript files       |
| `lib/descriptor-generator.ts` | Generates new descriptor code |
| `lib/reference-updater.ts`    | Updates external references   |
| `lib/module-updater.ts`       | Updates module files          |
| `lib/types.ts`                | Shared TypeScript types       |
