import { Module } from "@nestjs/common";
import { RelevancyRepository } from "./repositories/relevancy.repository";
import { RelevancyService } from "./services/relevancy.service";

@Module({
  providers: [RelevancyRepository, RelevancyService],
  exports: [RelevancyRepository, RelevancyService],
  imports: [],
})
export class RelevancyModule {}
