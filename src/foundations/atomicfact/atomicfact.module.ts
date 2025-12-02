import { Module, OnModuleInit } from "@nestjs/common";
import { modelRegistry } from "../../common/registries/registry";
import { AtomicFactModel } from "./entities/atomic.fact.model";
import { AtomicFactRepository } from "./repositories/atomicfact.repository";
import { AtomicFactService } from "./services/atomicfact.service";
import { KeyConceptModule } from "../keyconcept/keyconcept.module";

@Module({
  providers: [AtomicFactRepository, AtomicFactService],
  exports: [AtomicFactRepository, AtomicFactService],
  imports: [KeyConceptModule],
})
export class AtomicFactModule implements OnModuleInit {
  onModuleInit() {
    modelRegistry.register(AtomicFactModel);
  }
}
