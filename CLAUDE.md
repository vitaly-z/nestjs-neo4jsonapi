# NestJS Neo4j JSON:API Library - CLAUDE.md

This package is a published npm library providing the NestJS foundation for JSON:API + Neo4j applications.

## Purpose

Provides:
- **Bootstrap system** - Single function to configure entire NestJS app
- **Abstract base classes** - Repository, Service, Controller patterns
- **JSON:API protocol** - Serialization/deserialization
- **Foundation services** - Auth, Company, S3, Email, WebSocket
- **LangChain integration** - AgentFactory for AI agents

## Package Structure

```
src/
├── bootstrap/       # bootstrap() function for app initialization
├── core/            # Core services (JsonApiService, Neo4jService)
├── foundations/     # Foundation features
│   ├── auth/        # Authentication & JWT
│   ├── security/    # Authorization & scoping
│   ├── company/     # Multi-tenancy
│   ├── s3/          # Cloud storage
│   ├── email/       # Transactional emails
│   └── websocket/   # Real-time updates
├── agents/          # LangChain agent integration
└── config/          # Configuration interfaces
```

## Core Exports

| Entry Point | Contents |
|-------------|----------|
| `main` | AbstractRepository, AbstractService, AbstractController |
| `core` | JsonApiService, Neo4jService, SecurityService |
| `foundations` | AuthService, CompanyService, S3Service, EmailService |
| `agents` | AgentFactory, LangChain utilities |
| `bootstrap` | bootstrap() function |

## Key Patterns

### Bootstrap Pattern
```typescript
import { bootstrap } from "@carlonicora/nestjs-neo4jsonapi";

bootstrap({
  appModules: [PhotographModule, RollModule],
  config: {
    database: { uri: process.env.NEO4J_URI },
    auth: { jwtSecret: process.env.JWT_SECRET },
  },
});
```

### AbstractRepository Pattern
```typescript
@Injectable()
export class PhotographRepository extends AbstractRepository<Photograph, PhotographRelationships> {
  constructor(
    protected readonly neo4jService: Neo4jService,
    protected readonly securityService: SecurityService,
  ) {
    super(neo4jService, securityService, photographMeta, PhotographDescriptor);
  }

  // Custom query methods
  async findByRoll(rollId: string): Promise<Photograph[]> {
    // Uses inherited query building methods
  }
}
```

### AbstractService Pattern
```typescript
@Injectable()
export class PhotographService extends AbstractService<Photograph, PhotographRelationships> {
  constructor(
    protected readonly repository: PhotographRepository,
    protected readonly jsonApiService: JsonApiService,
  ) {
    super(repository, jsonApiService, photographMeta, PhotographDescriptor);
  }

  // Business logic methods
  async analysePhotograph(id: string): Promise<Analysis> {
    // Custom business logic
  }
}
```

## Rules for Changes

1. **Backward compatibility** - Breaking changes require major version bump
2. **Export all public APIs** - Add new exports to appropriate entry point
3. **Use NestJS DI** - All services use dependency injection
4. **Test abstractions** - Unit tests for base classes
5. **Document changes** - Update JSDoc for public APIs

## Testing

```bash
# Run library tests
pnpm --filter @carlonicora/nestjs-neo4jsonapi test

# Run with coverage
pnpm --filter @carlonicora/nestjs-neo4jsonapi test:coverage
```

## Publishing

- Package: `@carlonicora/nestjs-neo4jsonapi`
- Version: Managed in `package.json`
- Registry: npm

## Common Mistakes

| Mistake | Correct Approach |
|---------|------------------|
| Breaking public API | Create new method, deprecate old one |
| Missing export | Add to appropriate entry point index |
| Direct Neo4j access in services | Use repository layer |
| Hardcoded company filtering | Use SecurityService |
