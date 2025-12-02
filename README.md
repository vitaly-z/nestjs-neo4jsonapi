# @carlonicora/nestjs-neo4jsonapi

A comprehensive NestJS foundation package providing JSON:API compliant APIs, Neo4j graph database integration, Redis caching, LangChain-based AI agents (including GraphRAG), and common utilities for building modern applications.

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Quick Start](#quick-start)
- [Core Modules](#core-modules)
- [Foundation Modules](#foundation-modules)
- [AI Agents](#ai-agents)
- [Customizing Agent Prompts (Optional)](#customizing-agent-prompts-optional)
- [Configuration](#configuration)
- [Bootstrap Utilities](#bootstrap-utilities)

## Features

- **JSON:API Compliance**: Full JSON:API specification support with serializers, pagination, and cursor-based navigation
- **Neo4j Integration**: Graph database operations with Cypher query builder
- **Redis Caching**: Built-in caching layer with configurable TTLs
- **AI Agents**: LangChain-powered agents including GraphRAG for knowledge extraction, summarization, and intelligent responses
- **Authentication**: JWT-based authentication with role-based access control (RoleId UUIDs)
- **Background Jobs**: BullMQ integration for async job processing
- **WebSockets**: Real-time communication support
- **Tracing**: OpenTelemetry integration for distributed tracing
- **Logging**: Structured logging with Loki integration

## Installation

```bash
pnpm add @carlonicora/nestjs-neo4jsonapi
```

### Peer Dependencies

The following packages must be installed in your application (they are **not** bundled with the library to avoid version conflicts):

```bash
pnpm add nestjs-cls zod
```

| Package      | Version | Purpose                      |
| ------------ | ------- | ---------------------------- |
| `nestjs-cls` | ^6.0.1  | Request-scoped context (CLS) |
| `zod`        | ^4.0.0  | Schema validation            |

**Important**: These are peer dependencies to ensure your application and the library share the same package instances, preventing NestJS dependency injection issues.

## Environment Variables

Create a `.env` file with the following configuration:

```env
# Environment
ENV=development

# API
API_URL=http://localhost:3000/
API_PORT=3000

# App (frontend URL)
APP_URL=http://localhost:3001

# Neo4j
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=your-password
NEO4J_DATABASE=neo4j

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_USERNAME=
REDIS_QUEUE=default

# Cache
CACHE_ENABLED=true
CACHE_DEFAULT_TTL=600
CACHE_SKIP_PATTERNS=/access,/auth,/notifications,/websocket,/version

# JWT Authentication
JWT_SECRET=your-jwt-secret
JWT_EXPIRES_IN=1h

# CORS
CORS_ORIGINS=http://localhost:3001
CORS_CREDENTIALS=true

# AI Configuration
AI_PROVIDER=openai
AI_API_KEY=sk-...
AI_MODEL=gpt-4o-mini

# Embedder
EMBEDDER_PROVIDER=openai
EMBEDDER_API_KEY=sk-...
EMBEDDER_MODEL=text-embedding-3-small

# Logging (Loki - optional)
LOKI_ENABLED=false
LOKI_HOST=http://localhost:3100

# Tracing (Tempo - optional)
TEMPO_ENABLED=false
TEMPO_ENDPOINT=http://localhost:4318/v1/traces

# S3 Storage (optional)
S3_TYPE=aws
S3_ENDPOINT=
S3_BUCKET=
S3_ACCESS_KEY_ID=
S3_SECRET_ACCESS_KEY=
S3_REGION=eu-west-1

# Email (optional)
EMAIL_PROVIDER=sendgrid
EMAIL_API_KEY=
EMAIL_FROM=noreply@example.com

# Stripe (optional)
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=

# Push Notifications (optional)
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_EMAIL=

# Rate Limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_TTL=60000
RATE_LIMIT_REQUESTS=100

# Encryption
ENCRYPTION_KEY=your-32-char-encryption-key
```

## Quick Start

### 1. Setup App Module

The library uses a dynamic module pattern with `AppModeConfig` to support both API and Worker modes:

```typescript
// src/app.module.ts
import { DynamicModule, Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { ScheduleModule } from "@nestjs/schedule";
import { ThrottlerModule } from "@nestjs/throttler";
import { ClsModule } from "nestjs-cls";

// Import from the library
import {
  AgentsModule,
  AppModeConfig,
  AppModeModule,
  baseConfig,
  BaseConfigInterface,
  ConfigRateLimitInterface,
  CoreModule,
  FoundationsModule,
} from "@carlonicora/nestjs-neo4jsonapi";

// App-specific modules
import { FeaturesModules } from "src/features/features.modules";

@Module({})
export class AppModule {
  static forRoot(modeConfig: AppModeConfig): DynamicModule {
    return {
      module: AppModule,
      imports: [
        EventEmitterModule.forRoot(),
        AppModeModule.forRoot(modeConfig),
        ConfigModule.forRoot({
          load: [() => baseConfig],
          isGlobal: true,
          cache: true,
        }),
        ConfigModule,
        ThrottlerModule.forRootAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: (config: ConfigService<BaseConfigInterface>) => {
            const rateLimitConfig = config.get<ConfigRateLimitInterface>("rateLimit");
            return {
              throttlers: [
                {
                  name: "default",
                  ttl: rateLimitConfig.ttl,
                  limit: rateLimitConfig.limit,
                },
              ],
            };
          },
        }),
        ClsModule.forRoot({
          global: true,
          middleware: { mount: modeConfig.enableControllers },
        }),
        ...(modeConfig.enableCronJobs ? [ScheduleModule.forRoot()] : []),
        // Core infrastructure modules
        CoreModule.forRoot(),
        // Foundation modules (business domain)
        FoundationsModule.forRoot(),
        // AI Agents (contextualiser, graph.creator, responder, summariser)
        AgentsModule.forRoot(),
        // App-specific features
        FeaturesModules,
      ],
      global: true,
      controllers: [],
    };
  }
}
```

### 2. Setup main.ts (Bootstrap)

The bootstrap file handles both API and Worker modes with Fastify:

```typescript
// src/main.ts
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

// Initialize tracing before any other imports
import { tracingSetup } from "@carlonicora/nestjs-neo4jsonapi";
import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory, Reflector } from "@nestjs/core";
import { FastifyAdapter, NestFastifyApplication } from "@nestjs/platform-fastify";
import { EventEmitter } from "stream";
tracingSetup.initialize();

// Import from library
import {
  AppLoggingService,
  AppMode,
  AppModeConfig,
  BaseConfigInterface,
  CacheInterceptor,
  CacheService,
  ConfigApiInterface,
  ConfigRateLimitInterface,
  CorsService,
  getAppMode,
  getAppModeConfig,
  HttpExceptionFilter,
  LoggingInterceptor,
  TracingInterceptor,
} from "@carlonicora/nestjs-neo4jsonapi";

import { AppModule } from "./app.module";

async function bootstrapAPI(modeConfig: AppModeConfig): Promise<void> {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule.forRoot(modeConfig),
    new FastifyAdapter({
      routerOptions: { ignoreTrailingSlash: true },
      bodyLimit: 100 * 1024 * 1024,
    }),
    { logger: ["error", "warn"] },
  );

  const configService = app.get(ConfigService<BaseConfigInterface>);

  // Register multipart support for file uploads
  await app.register(require("@fastify/multipart"), {
    limits: {
      fileSize: 100 * 1024 * 1024,
      files: 10,
    },
  });

  const loggingService = app.get(AppLoggingService);
  app.useLogger(loggingService);

  // Add Fastify onSend hook for request logging
  app
    .getHttpAdapter()
    .getInstance()
    .addHook("onSend", async (request, reply, payload) => {
      const startTime = request.raw["requestStartTime"];
      if (startTime) {
        const responseTime = Date.now() - startTime;
        loggingService.logHttpRequest(request.method, request.url, reply.statusCode, responseTime, request.ip);
        loggingService.clearRequestContext();
      }
      return payload;
    });

  app.useGlobalFilters(new HttpExceptionFilter(loggingService));
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // Apply interceptors: Tracing -> Cache -> Logging
  app.useGlobalInterceptors(app.get(TracingInterceptor));
  app.useGlobalInterceptors(new CacheInterceptor(app.get(CacheService), app.get(Reflector), loggingService));
  app.useGlobalInterceptors(app.get(LoggingInterceptor));

  const corsService = app.get(CorsService);
  corsService.validateConfiguration();
  app.enableCors(corsService.getCorsConfiguration());

  const port = configService.get<ConfigApiInterface>("api").port;
  await app.listen(port, "0.0.0.0");
  loggingService.log(`API server started on port ${port}`);

  // Graceful shutdown
  process.on("SIGTERM", async () => {
    await app.close();
    process.exit(0);
  });
  process.on("SIGINT", async () => {
    await app.close();
    process.exit(0);
  });
}

async function bootstrapWorker(modeConfig: AppModeConfig): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule.forRoot(modeConfig), { logger: ["error", "warn"] });

  const loggingService = app.get(AppLoggingService);
  app.useLogger(loggingService);
  loggingService.log("Worker process started");

  process.on("SIGTERM", async () => {
    await app.close();
    process.exit(0);
  });
  process.on("SIGINT", async () => {
    await app.close();
    process.exit(0);
  });
}

async function bootstrap(): Promise<void> {
  EventEmitter.defaultMaxListeners = 50;

  const mode = getAppMode();
  const modeConfig = getAppModeConfig(mode);

  if (mode === AppMode.WORKER) {
    await bootstrapWorker(modeConfig);
  } else {
    await bootstrapAPI(modeConfig);
  }
}

bootstrap();
```

### 3. (Optional) Extend with App-Specific Config

**This step is only needed if** your application has custom configuration that the library doesn't provide:

```typescript
// src/config/configuration.ts
import { baseConfig } from "@carlonicora/nestjs-neo4jsonapi";

export default () => ({
  // Library handles all standard config
  ...baseConfig,

  // Your app-specific config (optional)
  myApp: {
    customSetting: process.env.MY_CUSTOM_SETTING || "default",
    featureFlag: process.env.MY_FEATURE_FLAG === "true",
  },
});
```

Then use it in your app module:

```typescript
import configuration from "./config/configuration";

ConfigModule.forRoot({
  isGlobal: true,
  load: [configuration],
}),
```

## Core Modules

The library includes 18 core infrastructure modules:

| Module            | Description                                      |
| ----------------- | ------------------------------------------------ |
| `Neo4JModule`     | Neo4j graph database integration                 |
| `RedisModule`     | Redis client and messaging                       |
| `CacheModule`     | Distributed caching layer                        |
| `SecurityModule`  | JWT authentication and role-based access control |
| `JsonApiModule`   | JSON:API specification compliance                |
| `LoggingModule`   | Structured logging with Loki                     |
| `TracingModule`   | Distributed tracing with OpenTelemetry           |
| `EmailModule`     | Email service (SendGrid, SMTP)                   |
| `QueueModule`     | BullMQ job queue processing                      |
| `WebsocketModule` | Real-time WebSocket communication                |
| `CorsModule`      | CORS configuration                               |
| `VersionModule`   | API versioning                                   |
| `StripeModule`    | Stripe payment integration                       |
| `LLMModule`       | LLM service for AI operations                    |
| `BlockNoteModule` | Block editor support                             |
| `MigratorModule`  | Database migrations                              |
| `AppModeModule`   | Application mode (API/Worker)                    |
| `DebugModule`     | Debugging utilities                              |

### Security Module - Role-Based Access Control

The security module uses `RoleId` UUID values (not string names):

```typescript
import { Controller, Get, UseGuards } from "@nestjs/common";
import { JwtAuthGuard, Roles, RoleId } from "@carlonicora/nestjs-neo4jsonapi";

@Controller("admin")
@UseGuards(JwtAuthGuard)
export class AdminController {
  // Use RoleId enum values (UUIDs), NOT strings
  @Get("dashboard")
  @Roles(RoleId.Administrator)
  async getDashboard() {
    // Only administrators can access
  }

  @Get("reports")
  @Roles(RoleId.Administrator, RoleId.CompanyAdministrator)
  async getReports() {
    // Administrators OR CompanyAdministrators can access
  }
}
```

Available RoleIds:

- `RoleId.Administrator` - System administrator
- `RoleId.CompanyAdministrator` - Company-level administrator

## Foundation Modules

The library includes 17 foundation modules for business domain logic:

| Module               | Description                                      |
| -------------------- | ------------------------------------------------ |
| `AtomicFactModule`   | Atomic facts management for knowledge graphs     |
| `AuditModule`        | Audit logging                                    |
| `AuthModule`         | Authentication (login, register, password reset) |
| `ChunkModule`        | Document chunk storage and retrieval             |
| `ChunkerModule`      | Document parsing (PDF, DOCX, XLSX, HTML)         |
| `CompanyModule`      | Multi-tenant company management                  |
| `ContentModule`      | Content management                               |
| `FeatureModule`      | Feature flag management                          |
| `KeyConceptModule`   | Key concepts for knowledge graphs                |
| `ModuleModule`       | Module/plugin management                         |
| `NotificationModule` | User notifications                               |
| `PushModule`         | Push notifications (VAPID)                       |
| `RelevancyModule`    | Relevancy scoring                                |
| `RoleModule`         | Role management                                  |
| `S3Module`           | S3-compatible storage                            |
| `TokenUsageModule`   | AI token usage tracking                          |
| `UserModule`         | User management with CRUD operations             |

## AI Agents

LangChain-powered agents for intelligent document processing.

### GraphCreatorModule

Extracts knowledge graphs from text, including atomic facts and key concept relationships.

```typescript
import { GraphCreatorService } from "@carlonicora/nestjs-neo4jsonapi/agents";

@Injectable()
export class MyService {
  constructor(private readonly graphCreator: GraphCreatorService) {}

  async extractKnowledge(text: string) {
    const result = await this.graphCreator.generateGraph({ content: text });
    // result contains: atomicFacts, keyConceptsRelationships, tokens
    return result;
  }
}
```

### ContextualiserModule (GraphRAG)

Implements **GraphRAG** (Graph-based Retrieval Augmented Generation) for intelligent context gathering. Unlike traditional RAG, GraphRAG:

- Uses a knowledge graph structure (Neo4j)
- Traverses atomic facts and key concepts
- Explores neighbouring nodes for richer context
- Provides more accurate and contextual responses

```typescript
import { ContextualiserService } from "@carlonicora/nestjs-neo4jsonapi/agents";

@Injectable()
export class MyService {
  constructor(private readonly contextualiser: ContextualiserService) {}

  async gatherContext(question: string) {
    return this.contextualiser.contextualise({ question });
  }
}
```

### SummariserModule

Generates summaries from document chunks using a map-reduce pattern.

```typescript
import { SummariserService } from "@carlonicora/nestjs-neo4jsonapi/agents";

@Injectable()
export class MyService {
  constructor(private readonly summariser: SummariserService) {}

  async summarize(chunks: Chunk[]) {
    const result = await this.summariser.summarise({ chunks });
    // result contains: content, tldr, tokens
    return result;
  }
}
```

### ResponderModule

Generates comprehensive answers based on gathered context.

```typescript
import { ResponderService } from "@carlonicora/nestjs-neo4jsonapi/agents";

@Injectable()
export class MyService {
  constructor(private readonly responder: ResponderService) {}

  async generateAnswer(context: any) {
    return this.responder.respond(context);
  }
}
```

## Customizing Agent Prompts (Optional)

The library includes default prompts optimized for Italian legal documents. **Customization is entirely optional** - the library works out of the box.

### Available Prompts (11 total)

| Agent              | Prompt                                   | Purpose                               |
| ------------------ | ---------------------------------------- | ------------------------------------- |
| **GraphCreator**   | `GRAPH_CREATOR_PROMPT`                   | Extract atomic facts and key concepts |
| **Contextualiser** | `CONTEXTUALISER_QUESTION_REFINER_PROMPT` | Refine user questions                 |
| **Contextualiser** | `CONTEXTUALISER_RATIONAL_PROMPT`         | Create rational plans                 |
| **Contextualiser** | `CONTEXTUALISER_KEYCONCEPTS_PROMPT`      | Score key concepts                    |
| **Contextualiser** | `CONTEXTUALISER_ATOMICFACTS_PROMPT`      | Evaluate atomic facts                 |
| **Contextualiser** | `CONTEXTUALISER_CHUNK_PROMPT`            | Assess text chunks                    |
| **Contextualiser** | `CONTEXTUALISER_CHUNK_VECTOR_PROMPT`     | Vector-based chunk assessment         |
| **Responder**      | `RESPONDER_ANSWER_PROMPT`                | Generate final answers                |
| **Summariser**     | `SUMMARISER_MAP_PROMPT`                  | Summarize individual chunks           |
| **Summariser**     | `SUMMARISER_COMBINE_PROMPT`              | Combine summaries                     |
| **Summariser**     | `SUMMARISER_TLDR_PROMPT`                 | Create TLDR                           |

### Recommended: Create a Prompts Folder

```
your-app/
├── src/
│   ├── prompts/
│   │   ├── index.ts                    # Re-exports all prompts
│   │   ├── graph-creator.prompt.ts     # Custom graph creator prompt
│   │   ├── contextualiser/
│   │   │   ├── question-refiner.prompt.ts
│   │   │   ├── rational-plan.prompt.ts
│   │   │   └── ...
│   │   └── summariser/
│   │       ├── map.prompt.ts
│   │       └── ...
```

### Define Custom Prompts

```typescript
// src/prompts/graph-creator.prompt.ts
export const graphCreatorPrompt = `
You are an intelligent assistant that extracts structured knowledge from text.

## Domain Context: Medical Documents

Focus on extracting:
- Medical terminology and procedures
- Patient-doctor relationships
- Diagnosis and treatment information
...
`;
```

### Pass to Module

```typescript
// src/app.module.ts
import { graphCreatorPrompt } from "./prompts/graph-creator.prompt";
import { questionRefinerPrompt } from "./prompts/contextualiser/question-refiner.prompt";

@Module({
  imports: [
    // Option 1: Customize individual modules
    GraphCreatorModule.forRoot({
      prompt: graphCreatorPrompt,
    }),

    ContextualiserModule.forRoot({
      prompts: {
        questionRefiner: questionRefinerPrompt,
        // Other prompts use defaults if not specified
      },
    }),

    // Option 2: Customize via centralized AgentsModule
    AgentsModule.forRoot({
      prompts: {
        graphCreator: graphCreatorPrompt,
        contextualiser: {
          questionRefiner: questionRefinerPrompt,
        },
        summariser: {
          map: customMapPrompt,
        },
      },
    }),
  ],
})
export class AppModule {}
```

### Access Default Prompts for Reference

```typescript
import { defaultGraphCreatorPrompt, defaultResponderAnswerPrompt } from "@carlonicora/nestjs-neo4jsonapi/agents";

// Use as a base and extend
const customPrompt =
  defaultGraphCreatorPrompt +
  `
## Additional Instructions
- Your domain-specific additions here
`;
```

## Configuration

### BaseConfigInterface

The library provides `BaseConfigInterface` with 16 configuration domains:

```typescript
interface BaseConfigInterface {
  environment: ConfigEnvironmentInterface; // api | worker
  api: ConfigApiInterface; // URL, port, environment
  app: ConfigAppInterface; // Frontend URL
  neo4j: ConfigNeo4jInterface; // Database connection
  redis: ConfigRedisInterface; // Cache/queue connection
  cache: ConfigCacheInterface; // Cache settings
  cors: ConfigCorsInterface; // CORS policy
  jwt: ConfigJwtInterface; // JWT settings
  vapid: ConfigVapidInterface; // Push notification keys
  email: ConfigEmailInterface; // Email provider
  logging: ConfigLoggingInterface; // Loki logging
  tempo: ConfigTempoInterface; // Distributed tracing
  s3: ConfigS3Interface; // Object storage
  ai: ConfigAiInterface; // AI/LLM settings
  rateLimit: ConfigRateLimitInterface; // Rate limiting
  encryption: ConfigEncryptionInterface; // Data encryption
  stripe: ConfigStripeInterface; // Payment processing
}
```

### Injection Tokens

Use injection tokens for optional dependencies:

```typescript
import {
  NEO4J_CONFIG,
  REDIS_CONFIG,
  AI_CONFIG,
  COMPANY_CONFIGURATIONS_FACTORY,
} from "@carlonicora/nestjs-neo4jsonapi/config";
```

## Bootstrap Utilities

Helper functions for application bootstrap:

```typescript
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix("api/v1");
  app.enableCors();

  await app.listen(process.env.API_PORT || 3000);
}

bootstrap();
```

## License

MIT

## Author

Carlo Nicora - [@carlonicora](https://github.com/carlonicora)

## Commercial Licensing

This project is licensed under GPL v3 for open source use.
For commercial/closed-source licensing, contact: [@carlonicora](https://github.com/carlonicora)
