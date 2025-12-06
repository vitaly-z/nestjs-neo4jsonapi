# Repository & Service Migration Guide

This document provides instructions for Claude Code to migrate repository and service files to the descriptor-based architecture after an entity has been migrated using `migrate-entity`.

---

# MANDATORY CHECKLIST - READ BEFORE DOING ANYTHING

**STOP. Before making ANY edits, you MUST complete this checklist.**

## 1. READ the Abstract Classes (5 min)

```
# If using the package:
node_modules/@carlonicora/nestjs-neo4jsonapi/src/core/neo4j/abstracts/abstract.repository.ts
node_modules/@carlonicora/nestjs-neo4jsonapi/@carlonicora/nestjs-neo4jsonapi.ts
```

**You MUST understand what methods are already inherited before proceeding.**

## 2. CHECK cypher.service.ts for Custom Logic (2 min)

If the module has `{entity}.cypher.service.ts`:

```
Look for: returnStatement(params?: { someFlag?: boolean })
```

- **Has custom parameters?** → You MUST override `buildReturnStatement()` in repository
- **Has computed expressions (totalScore, COUNT, etc)?** → You MUST migrate them to repository
- **Do NOT just delete cypher.service.ts** until you've migrated custom logic

## 3. SEARCH for External Usage of cypher.service.ts (2 min)

```
Search the ENTIRE codebase for: {Entity}CypherService
```

**WARNING: Other modules may call the cypher.service.ts** (e.g., relevancy module calls document's cypher service). If you find external usage, the custom return logic is NOT dead code.

## 4. KNOW These Rules

- **DO NOT rename methods** - `create()` stays `create()`, never `createDocument()`
- **DO NOT create wrapper methods** - If a method only does DTO mapping → DELETE it
- `createFromDTO` ALREADY reads from DTO - you don't need a wrapper
- `contextKey` is a FALLBACK for CLS, not required if DTO has the relationship

---

## WRONG vs CORRECT Examples

### WRONG: Creating a wrapper method

```typescript
// WRONG - This is redundant with inherited createFromDTO
async createDocument(params: { data: DocumentPostDataDTO }): Promise<JsonApiDataInterface> {
  await this.documentRepository.create({
    id: params.data.id,
    name: params.data.attributes.name,
    url: params.data.attributes.url,
    // ... mapping DTO fields
    author: params.data.relationships.author.data.id,
  });
  return this.findById({ id: params.data.id });
}
```

### CORRECT: Use inherited method

```typescript
// CORRECT - Just use the inherited method directly from controller
// No service method needed at all - the controller calls service.createFromDTO()
```

### WRONG: Renaming a method

```typescript
// WRONG - Renamed create() to createDocument() "to avoid conflict"
async createDocument(params: { ... })

// WRONG - Renamed put() to putDocument()
async putDocument(params: { ... })
```

### CORRECT: Keep original names or delete

```typescript
// CORRECT - If create() is just DTO mapping, DELETE it entirely
// CORRECT - If create() has extra logic, KEEP the name create()
async create(params: { ... }) { /* extra logic like WebSocket notification */ }
```

### WRONG: Not migrating cypher.service.ts logic

```typescript
// cypher.service.ts has:
returnStatement(params?: { useTotalScore?: boolean }) {
  if (params?.useTotalScore) {
    return '... totalScore AS totalScore ...';
  }
}

// WRONG - Just deleting the file without migrating
// Result: totalScore computed field stops working
```

### CORRECT: Override buildReturnStatement in repository

```typescript
// CORRECT - Migrate the logic to repository
protected buildReturnStatement(params?: { useTotalScore?: boolean }): string {
  const baseReturn = super.buildReturnStatement();
  if (params?.useTotalScore) {
    return baseReturn.replace('RETURN', 'WITH *, score AS totalScore\nRETURN') + ', totalScore';
  }
  return baseReturn;
}
```

---

## Pre-requisites

Before migrating repository and service files:

1. **Entity must be migrated first** - The `{EntityName}Descriptor` must exist in `entities/{entity}.ts`
2. **Build passes** - Verify with `pnpm build`
3. **Lint passes** - Verify with `pnpm lint`

---

## CRITICAL: Verify Descriptor Relationships

**Before migrating, verify that the descriptor's relationships match the actual database schema.**

The entity migration tool infers relationships using heuristics, but it may not know your actual database schema. The inherited `findByRelated()` method will use the descriptor's relationship definitions - if they're wrong, queries will fail at runtime.

### How to Verify

1. **Read the current repository** - Look for Cypher queries that define relationships
2. **Read the cypher.service.ts** (if exists) - Check the RETURN statement for relationship patterns
3. **Compare with descriptor** - Verify each relationship's `direction` and `relationship` name

### What to Check

For each relationship in the descriptor, verify:

| Property       | What it means                                                                 | Where to find actual value                        |
| -------------- | ----------------------------------------------------------------------------- | ------------------------------------------------- |
| `relationship` | The Neo4j relationship type (e.g., `"PUBLISHED"`, `"EDITED"`)                 | Look for `[:RELATIONSHIP_NAME]` in Cypher queries |
| `direction`    | `"in"` = `(entity)<-[:REL]-(related)`, `"out"` = `(entity)-[:REL]->(related)` | Look at arrow direction in Cypher `MATCH` clauses |

### Example Mismatch

**Descriptor says:**

```typescript
relationships: {
  user: { model: userMeta, direction: "out", relationship: "ACCESSIBLE_BY", ... },
  topic: { model: topicMeta, direction: "out", relationship: "RELEVANT_FOR", ... },
}
```

**But repository/cypher.service.ts actually uses:**

```cypher
MATCH (article)<-[:EDITED]-(user:User)
MATCH (article)<-[:HAS_KNOWLEDGE]-(topic:Topic)
```

**Fix the descriptor to match reality:**

```typescript
relationships: {
  user: { model: userMeta, direction: "in", relationship: "EDITED", ... },
  topic: { model: topicMeta, direction: "in", relationship: "HAS_KNOWLEDGE", ... },
}
```

### Action Required

If you find mismatches:

1. **Fix the descriptor FIRST** - Update `entities/{entity}.ts` with correct relationship names and directions
2. **Run build/lint** - Verify changes compile
3. **Then proceed** with repository/service migration

**Do NOT proceed with migration if relationships don't match - the inherited methods will query wrong relationships.**

---

## CRITICAL: Method Naming Rules

When migrating, follow these rules strictly:

- **DO NOT rename methods** - Keep original method names unchanged
- **DO NOT create wrapper methods** that just do DTO field mapping
- If a method is redundant with inherited methods → **DELETE it entirely**
- If a method has domain logic → **KEEP it with its original name**

**Common mistakes to avoid:**

- Creating `create{EntityName}()` when `createFromDTO()` already handles it → DELETE
- Creating `put{EntityName}()` when `putFromDTO()` already handles it → DELETE
- Renaming `create()` to `create{EntityName}()` → DON'T rename, DELETE if redundant

---

## CRITICAL: Handling cypher.service.ts Files

When a module has a `{entity}.cypher.service.ts` file, you must check it before migration.

### Step 1: Check if returnStatement has custom logic

Look for:

- Custom parameters on `returnStatement()` method (e.g., `useTotalScore?: boolean`)
- Computed aggregations in the RETURN clause (e.g., `totalScore`, `COUNT(...)`, `SUM(...)`)
- Additional MATCH patterns beyond relationships

### Step 2: If custom returnStatement exists

**DO NOT just delete the cypher.service.ts file.**

Instead, migrate the custom return logic to an override of `buildReturnStatement()` in the repository:

```typescript
// In {EntityName}Repository

/**
 * Override to include computed fields when needed
 */
protected buildReturnStatement(params?: { includeComputedField?: boolean }): string {
  const baseReturn = super.buildReturnStatement();

  if (params?.includeComputedField) {
    // Add computed field to the return statement
    return baseReturn.replace(
      'RETURN',
      'WITH *, <computed_expression> AS computedField\nRETURN'
    ) + ', computedField';
  }

  return baseReturn;
}
```

### Step 3: Override find() if needed

If `find()` needs the computed field, override it to use the custom return statement:

```typescript
async find(params: FindParams & { includeComputedField?: boolean }): Promise<{EntityName}[]> {
  // Use custom buildReturnStatement with the flag
  const query = this.neo4j.initQuery({ serialiser: this.descriptor.model });
  query.query = `
    ${this.buildDefaultMatch()}
    ${this.buildReturnStatement({ includeComputedField: params.includeComputedField })}
  `;
  // ... rest of implementation
}
```

### Result After Migration

- cypher.service.ts is **DELETED**
- Custom return logic moves to repository `buildReturnStatement()` override
- Repository remains the single source of Cypher queries

### WARNING: Check Before Deleting

Before deleting a cypher.service.ts file, verify:

1. **All relationships are in the descriptor** - Check the descriptor's `relationships` object covers all MATCH patterns
2. **No computed fields in RETURN** - If returnStatement has computed expressions, override `buildReturnStatement()` first
3. **No conditional RETURN logic** - If returnStatement takes parameters that change output, handle in override

**If ANY of these exist → migrate the logic to repository BEFORE deleting cypher.service.ts**

---

## Part 1: Repository Migration

### Goal

Transform a repository to extend `AbstractRepository`, removing all generic CRUD methods that are now inherited.

### Step 1: Read the Abstract Base Class

**CRITICAL**: Before migrating, read the abstract repository to understand what methods are inherited:

**Inherited methods (these will be DELETED from the repository):**

- `onModuleInit()` - Constraint/index creation
- `find(params)` - List with search, ordering, pagination
- `findById(params)` - Single entity with security validation
- `findByRelated(params)` - Query by related entity
- `create(params)` - Create with fields and relationships from descriptor
- `put(params)` - Full update
- `patch(params)` - Partial update
- `delete(params)` - Delete entity
- `buildDefaultMatch()` - Internal query builder
- `buildReturnStatement()` - Internal query builder
- `buildUserHasAccess()` - Internal query builder
- `_validateForbidden()` - Internal security validation

### Step 2: Update Class Declaration

**Pattern to find (OLD):**

```typescript
@Injectable()
export class {EntityName}Repository implements OnModuleInit {
  constructor(
    private readonly neo4j: Neo4jService,
    private readonly securityService: SecurityService,
    // ... possibly other dependencies
  ) {}
```

**Replace with (NEW):**

```typescript
import { AbstractRepository } from "@carlonicora/nestjs-neo4jsonapi/core/neo4j";
import { {EntityName}, {EntityName}Descriptor } from "src/features/{module}/entities/{entity}";

@Injectable()
export class {EntityName}Repository extends AbstractRepository<{EntityName}, typeof {EntityName}Descriptor.relationships> {
  protected readonly descriptor = {EntityName}Descriptor;

  constructor(neo4j: Neo4jService, securityService: SecurityService) {
    super(neo4j, securityService);
  }
```

### Step 3: Identify Methods to DELETE

**Delete ANY method that matches these patterns:**

| Pattern                                  | Why Delete                                              |
| ---------------------------------------- | ------------------------------------------------------- |
| `async onModuleInit()`                   | Inherited - handles constraints/indexes from descriptor |
| `async find(params: {...})`              | Inherited - generic list with pagination                |
| `async findById(params: { id: string })` | Inherited - generic single entity fetch                 |
| `async create(params: {...})`            | Inherited - uses descriptor.fields for properties       |
| `async put(params: {...})`               | Inherited - full update with all fields                 |
| `async patch(params: {...})`             | Inherited - partial update                              |
| `async delete(params: { id: string })`   | Inherited - generic delete                              |
| `buildDefaultMatch(...)`                 | Inherited - internal helper                             |
| `buildReturnStatement(...)`              | Inherited - internal helper                             |
| `buildUserHasAccess(...)`                | Inherited - internal helper                             |
| `_validateForbidden(...)`                | Inherited - internal helper                             |

**Delete ANY `findBy{X}` method where X is a relationship name:**

If the descriptor has:

```typescript
relationships: {
  author: { ... },
  topic: { ... },
  user: { ... },
}
```

Then DELETE these methods (they're replaced by inherited `findByRelated`):

- `findByAuthor()`
- `findByTopic()`
- `findByUser()`
- `findByUsers()` (plural variations too)
- Any `findBy{RelationshipName}()` pattern

### Step 4: Identify Methods to KEEP

**KEEP methods that have domain-specific logic that CANNOT be generalized:**

A method should be KEPT if it does ANY of the following:

1. **Partial field updates** - Only updates specific fields (not all fields)
2. **Custom Cypher queries** - Queries that don't fit find/findById/findByRelated patterns
3. **Aggregations** - COUNT, SUM, statistical queries
4. **Complex multi-step operations** - Operations combining multiple queries
5. **Non-standard relationships** - Queries traversing relationships not in the descriptor

**Examples of methods to KEEP:**

```typescript
// KEEP: Partial field update (only updates aiStatus)
async updateStatus(params: { id: string; aiStatus: AiStatus }): Promise<void>

// KEEP: Partial field update (only updates abstract and tldr)
async updateAbstract(params: { id: string; abstract: string; tldr: string }): Promise<void>

// KEEP: Custom aggregation
async countByCategory(params: { categoryId: string }): Promise<number>

// KEEP: Complex query with custom logic
async findWithScores(params: { threshold: number }): Promise<T[]>
```

### Step 5: Update Kept Methods to Use Descriptor

In any methods you keep, replace hardcoded values with descriptor references:

| Old Pattern                          | New Pattern                              |
| ------------------------------------ | ---------------------------------------- |
| `"{entityName}"` (node name string)  | `{EntityName}Descriptor.model.nodeName`  |
| `"{EntityName}"` (label name string) | `{EntityName}Descriptor.model.labelName` |
| `{entityName}Meta.nodeName`          | `{EntityName}Descriptor.model.nodeName`  |
| `{entityName}Meta.labelName`         | `{EntityName}Descriptor.model.labelName` |

**Example transformation:**

```typescript
// BEFORE
query.query += `
  MATCH (article:Article {id: $id})-[:BELONGS_TO]->(company)
  SET article.aiStatus = $aiStatus
`;

// AFTER
query.query += `
  MATCH (${EntityDescriptor.model.nodeName}:${EntityDescriptor.model.labelName} {id: $id})-[:BELONGS_TO]->(company)
  SET ${EntityDescriptor.model.nodeName}.aiStatus = $aiStatus
`;
```

### Step 6: Update Imports

**Remove imports that are no longer needed:**

- `{EntityName}Model` → DELETE (replaced by `{EntityName}Descriptor.model`)
- `{entityName}Meta` → DELETE (replaced by `{EntityName}Descriptor.model`)
- `{entityName}Mapper` → DELETE (now in descriptor)
- `childrenTokens` → DELETE (now in descriptor)
- `OnModuleInit` from `@nestjs/common` → DELETE (inherited)

**Add required imports:**

```typescript
import { AbstractRepository } from "@carlonicora/nestjs-neo4jsonapi/core/neo4j";
import { {EntityName}, {EntityName}Descriptor } from "src/features/{module}/entities/{entity}";
```

---

## Part 2: Service Migration

### Goal

Transform a service to extend `AbstractService`, removing all generic CRUD wrapper methods.

### Step 1: Read the Abstract Base Class

**CRITICAL**: Before migrating, read the abstract service to understand what methods are inherited:

**Inherited methods (these will be DELETED from the service):**

- `find(params)` - List with JSON:API pagination
- `findById(params)` - Single entity as JSON:API response
- `create(params)` - Create entity
- `createFromDTO(params)` - Create from JSON:API DTO with automatic mapping
- `put(params)` - Full update
- `putFromDTO(params)` - Full update from JSON:API DTO
- `patch(params)` - Partial update
- `patchFromDTO(params)` - Partial update from JSON:API DTO
- `delete(params)` - Delete with ownership validation
- `findByRelated(params)` - Query by related entity
- `mapDTOToParams(data)` - Internal DTO mapping helper
- `mapDTOToPatchParams(data)` - Internal DTO mapping helper

### Step 2: Update Class Declaration

**Pattern to find (OLD):**

```typescript
@Injectable()
export class {EntityName}Service {
  constructor(
    private readonly builder: JsonApiService,  // or jsonApiService
    private readonly {entityName}Repository: {EntityName}Repository,
    private readonly clsService: ClsService,
    // ... other dependencies
  ) {}
```

**Replace with (NEW):**

```typescript
import { AbstractService } from "@carlonicora/nestjs-neo4jsonapi/core/neo4j";
import { {EntityName}, {EntityName}Descriptor } from "src/features/{module}/entities/{entity}";

@Injectable()
export class {EntityName}Service extends AbstractService<{EntityName}, typeof {EntityName}Descriptor.relationships> {
  protected readonly descriptor = {EntityName}Descriptor;

  constructor(
    jsonApiService: JsonApiService,
    private readonly {entityName}Repository: {EntityName}Repository,
    clsService: ClsService,
    // ... domain-specific dependencies (keep these)
  ) {
    super(jsonApiService, {entityName}Repository, clsService, {EntityName}Descriptor.model);
  }
```

### Step 3: Identify Methods to DELETE

**Delete ANY method that is a thin wrapper around repository methods:**

A method should be DELETED if it ONLY does:

1. Creates a paginator
2. Calls repository method
3. Returns `this.builder.buildList()` or `this.builder.buildSingle()`

**Pattern to identify (DELETE these):**

```typescript
// DELETE: Just wraps repository.find
async find(params: { query: any; term?: string; ... }): Promise<JsonApiDataInterface> {
  const paginator = new JsonApiPaginator(params.query);
  return this.builder.buildList(
    SomeModel,
    await this.repository.find({ ... }),
    paginator,
  );
}

// DELETE: Just wraps repository.findById
async findById(params: { id: string }): Promise<JsonApiDataInterface> {
  return this.builder.buildSingle(
    SomeModel,
    await this.repository.findById({ id: params.id }),
  );
}

// DELETE: Just wraps repository.create and returns findById
async create(params: { data: SomeDTO }): Promise<JsonApiDataInterface> {
  await this.repository.create({ ... });
  return this.findById({ id: params.data.id });
}
```

**Delete ANY `findBy{X}` method that just wraps repository:**

- `findByAuthor()` → DELETE (use inherited `findByRelated`)
- `findByTopic()` → DELETE (use inherited `findByRelated`)
- `findByUser()` → DELETE (use inherited `findByRelated`)
- Any `findBy{RelationshipName}()` that just wraps repository

### Step 4: Identify Methods to KEEP

**KEEP methods that have business logic beyond simple CRUD:**

A method should be KEPT if it does ANY of the following:

1. **Calls external services** - WebSocket, email, notification services
2. **Queues background jobs** - BullMQ queue operations
3. **Orchestrates multiple operations** - Calls multiple services/repositories
4. **Has conditional business logic** - If/else based on business rules
5. **Transforms data** - Beyond simple DTO mapping
6. **Validates business rules** - Domain-specific validation

**Examples of methods to KEEP:**

```typescript
// KEEP: Queues background jobs, calls multiple services
async queueForProcessing(params: { id: string; content: string }): Promise<void> {
  await this.updateStatus({ id: params.id, aiStatus: AiStatus.InProgress });
  await this.chunkService.deleteChunks({ ... });
  // ... more business logic
  await this.queue.add(JobName.process, { ... });
}

// KEEP: Calls WebSocket service
async updateStatus(params: { id: string; status: string }): Promise<void> {
  await this.repository.updateStatus(params);
  await this.webSocketService.sendMessage({ ... });
}

// KEEP: Complex business logic
async processWithValidation(params: { ... }): Promise<void> {
  if (someCondition) {
    // business logic A
  } else {
    // business logic B
  }
}
```

### Step 5: Update Kept Methods to Use Descriptor

In any methods you keep, replace hardcoded values:

| Old Pattern                       | New Pattern                              |
| --------------------------------- | ---------------------------------------- |
| `{EntityName}Model`               | `{EntityName}Descriptor.model`           |
| `{entityName}Meta.labelName`      | `{EntityName}Descriptor.model.labelName` |
| `{entityName}Meta.nodeName`       | `{EntityName}Descriptor.model.nodeName`  |
| Hardcoded `"EntityLabel"` strings | `{EntityName}Descriptor.model.labelName` |

### Step 6: Update Imports

**Remove imports that are no longer needed:**

- `{EntityName}Model` → DELETE
- `{entityName}Meta` → DELETE
- `JsonApiPaginator` → DELETE (if no longer used)

**Add required imports:**

```typescript
import { AbstractService } from "@carlonicora/nestjs-neo4jsonapi/core/neo4j";
import { {EntityName}, {EntityName}Descriptor } from "src/features/{module}/entities/{entity}";
```

---

## Part 3: Controller Updates

After migrating the service, update any controller methods that called deleted service methods.

**Transform `findBy{X}` calls to `findByRelated`:**

```typescript
// BEFORE
return this.service.findByAuthor({ authorId, query });
return this.service.findByTopic({ topicId, query });
return this.service.findByUser({ userId, query });

// AFTER
return this.service.findByRelated({ relationship: "author", id: authorId, query });
return this.service.findByRelated({ relationship: "topic", id: topicId, query });
return this.service.findByRelated({ relationship: "user", id: userId, query });
```

The relationship name must match a key in the descriptor's `relationships` object.

---

## Decision Tree: Keep or Delete?

Use this decision tree for any method you're unsure about:

### Service Method Decision Tree

```
Does the method ONLY do DTO field mapping and call repository.create/put/patch?
├── YES → DELETE (use inherited createFromDTO/putFromDTO/patchFromDTO)
└── NO → Continue...

Is the method signature identical to one in AbstractRepository/AbstractService?
├── YES → DELETE (it's inherited)
└── NO → Continue...

Does the method only wrap a repository call and return JSON:API response?
├── YES → DELETE (use inherited method)
└── NO → Continue...

Is it a findBy{X} where X is a relationship in the descriptor?
├── YES → DELETE (use findByRelated)
└── NO → Continue...

Does the method have ANY of these?
  - External service calls (WebSocket, Queue, Email, etc.)
  - Business logic (conditionals, validations, transformations)
  - Multiple service/repository calls
  - Partial field updates (not all fields)
  - Custom Cypher queries
  - Modifying collections (e.g., adding user to editors list)
├── YES → KEEP with original name (do NOT rename)
└── NO → DELETE (it's generic CRUD)
```

**Examples of additional logic that means KEEP:**

- Adding current user to a relationship list (editor tracking)
- Calling WebSocket/Queue/Email services after CRUD
- Conditional business rules
- Data transformations beyond simple DTO mapping

---

## Verification Checklist

After migration:

1. **Build passes**: `pnpm build`
2. **Lint passes**: `pnpm lint`
3. **No old model references**: Search for `{EntityName}Model`, `{entityName}Meta`
4. **Descriptor used everywhere**: All node/label names come from descriptor
5. **No duplicate CRUD**: Generic methods removed, using inherited ones
6. **Controllers updated**: All `findBy{X}` calls converted to `findByRelated`

---

## Quick Reference: Pattern Replacements

| What to Find                           | Replace With                                             |
| -------------------------------------- | -------------------------------------------------------- |
| `{EntityName}Model`                    | `{EntityName}Descriptor.model`                           |
| `{entityName}Meta`                     | `{EntityName}Descriptor.model`                           |
| `{entityName}Meta.nodeName`            | `{EntityName}Descriptor.model.nodeName`                  |
| `{entityName}Meta.labelName`           | `{EntityName}Descriptor.model.labelName`                 |
| `implements OnModuleInit`              | Remove (inherited)                                       |
| `findBy{Relationship}(...)`            | `findByRelated({ relationship: '{relationship}', ... })` |
| `this.builder.buildList(Model, ...)`   | Remove method (inherited)                                |
| `this.builder.buildSingle(Model, ...)` | Remove method (inherited)                                |
