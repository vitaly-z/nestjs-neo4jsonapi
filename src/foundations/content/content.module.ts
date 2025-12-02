import { Module, OnModuleInit } from "@nestjs/common";
import { modelRegistry } from "../../common/registries/registry";
import { AuditModule } from "../audit/audit.module";
import { ContentController } from "./controllers/content.controller";
import { ContentModel } from "./entities/content.model";
import { ContentRepository } from "./repositories/content.repository";
import { ContentSerialiser } from "./serialisers/content.serialiser";
import { ContentCypherService } from "./services/content.cypher.service";
import { ContentService } from "./services/content.service";
import { RelevancyModule } from "../relevancy/relevancy.module";

@Module({
  controllers: [ContentController],
  providers: [ContentSerialiser, ContentRepository, ContentService, ContentCypherService],
  exports: [],
  imports: [AuditModule, RelevancyModule],
})
export class ContentModule implements OnModuleInit {
  onModuleInit() {
    modelRegistry.register(ContentModel);
  }
}
