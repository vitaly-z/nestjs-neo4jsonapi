import { Module, OnModuleInit } from "@nestjs/common";
import { modelRegistry } from "../../common/registries/registry";
import { S3Controller } from "./controllers/s3.controller";
import { S3Model } from "./entities/s3.model";
import { S3Serialiser } from "./serialisers/s3.serialiser";
import { S3Service } from "./services/s3.service";

@Module({
  controllers: [S3Controller],
  providers: [S3Service, S3Serialiser],
  exports: [S3Service, S3Serialiser],
})
export class S3Module implements OnModuleInit {
  onModuleInit() {
    modelRegistry.register(S3Model);
  }
}
