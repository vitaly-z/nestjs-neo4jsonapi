import { Module, OnModuleInit } from "@nestjs/common";

import { modelRegistry } from "../../common/registries/registry";
import { FeatureController } from "./controllers/feature.controller";
import { FeatureModel } from "./entities/feature.model";
import { FeatureSerialiser } from "./serialisers/feature.serialiser";
import { FeatureRepository } from "./repositories/feature.repository";
import { FeatureService } from "./services/feature.service";

@Module({
  controllers: [FeatureController],
  providers: [FeatureRepository, FeatureService, FeatureSerialiser],
  exports: [FeatureService, FeatureRepository, FeatureSerialiser],
})
export class FeatureModule implements OnModuleInit {
  onModuleInit() {
    modelRegistry.register(FeatureModel);
  }
}
