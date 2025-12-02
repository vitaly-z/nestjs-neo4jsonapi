import { BullModule } from "@nestjs/bullmq";
import { DynamicModule, Module, OnModuleInit } from "@nestjs/common";
import { GraphCreatorModule } from "../../agents/graph.creator/graph.creator.module";
import { createWorkerProvider } from "../../common/decorators/conditional-service.decorator";
import { modelRegistry } from "../../common/registries/registry";
import { LLMModule } from "../../core/llm/llm.module";
import { AtomicFactModule } from "../atomicfact/atomicfact.module";
import { KeyConceptModule } from "../keyconcept/keyconcept.module";
import { S3Module } from "../s3/s3.module";
import { TokenUsageModule } from "../tokenusage/tokenusage.module";
import { ChunkController } from "./controllers/chunk.controller";
import { ChunkModel } from "./entities/chunk.model";
import { ChunkProcessor } from "./processors/chunk.processor";
import { ChunkRepository } from "./repositories/chunk.repository";
import { ChunkSerialiser } from "./serialisers/chunk.serialiser";
import { ChunkService } from "./services/chunk.service";

export interface ChunkModuleOptions {
  /**
   * Queue IDs to register with BullMQ
   */
  queueIds: string[];
}

@Module({
  controllers: [ChunkController],
  providers: [ChunkService, ChunkRepository, ChunkSerialiser],
  exports: [ChunkService, ChunkRepository, ChunkSerialiser],
})
export class ChunkModule implements OnModuleInit {
  static forRoot(options: ChunkModuleOptions): DynamicModule {
    const queueImports = options.queueIds.map((queueId) => BullModule.registerQueue({ name: queueId }));

    return {
      module: ChunkModule,
      controllers: [ChunkController],
      providers: [ChunkService, ChunkRepository, ChunkSerialiser, createWorkerProvider(ChunkProcessor)],
      exports: [ChunkService, ChunkRepository, ChunkSerialiser],
      imports: [
        ...queueImports,
        AtomicFactModule,
        GraphCreatorModule,
        KeyConceptModule,
        S3Module,
        LLMModule,
        TokenUsageModule,
      ],
    };
  }

  onModuleInit() {
    modelRegistry.register(ChunkModel);
  }
}
