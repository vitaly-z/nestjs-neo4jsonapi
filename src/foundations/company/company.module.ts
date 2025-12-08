import { BullModule } from "@nestjs/bullmq";
import { Module, OnModuleInit } from "@nestjs/common";
import { createWorkerProvider } from "../../common/decorators/conditional-service.decorator";
import { modelRegistry } from "../../common/registries/registry";

import { QueueId } from "../../config";
import { FeatureModule } from "../feature/feature.module";
import { S3Module } from "../s3/s3.module";
import { CompanyController } from "./controllers/company.controller";
import { CompanyModel } from "./entities/company.model";
import { CompanyProcessor } from "./processors/company.processor";
import { CompanyRepository } from "./repositories/company.repository";
import { CompanySerialiser } from "./serialisers/company.serialiser";
import { CompanyService } from "./services/company.service";

@Module({
  controllers: [CompanyController],
  providers: [CompanyRepository, CompanyService, CompanySerialiser, createWorkerProvider(CompanyProcessor)],
  exports: [CompanyService, CompanySerialiser, CompanyRepository],
  imports: [BullModule.registerQueue({ name: QueueId.COMPANY }), FeatureModule, S3Module],
})
export class CompanyModule implements OnModuleInit {
  onModuleInit() {
    modelRegistry.register(CompanyModel);
  }
}
