import { Module, OnModuleInit } from "@nestjs/common";
import { modelRegistry } from "../../common/registries/registry";
import { LLMModule } from "../../core/llm/llm.module";
import { KeyConceptModel } from "./entities/key.concept.model";
import { KeyConceptRepository } from "./repositories/keyconcept.repository";
import { KeyConceptService } from "./services/keyconcept.service";

@Module({
  providers: [KeyConceptRepository, KeyConceptService],
  exports: [KeyConceptRepository, KeyConceptService],
  imports: [LLMModule],
})
export class KeyConceptModule implements OnModuleInit {
  onModuleInit() {
    modelRegistry.register(KeyConceptModel);
  }
}
