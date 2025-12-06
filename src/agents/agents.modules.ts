import { Module } from "@nestjs/common";
import { ContextualiserModule } from "./contextualiser/contextualiser.module";
import { GraphCreatorModule } from "./graph.creator/graph.creator.module";
import { ResponderModule } from "./responder/responder.module";
import { SummariserModule } from "./summariser/summariser.module";

/**
 * Centralized module for all AI agents.
 *
 * Prompts are configured via baseConfig.prompts (set in createBaseConfig()).
 */
@Module({
  imports: [ContextualiserModule, GraphCreatorModule, ResponderModule, SummariserModule],
  exports: [ContextualiserModule, GraphCreatorModule, ResponderModule, SummariserModule],
})
export class AgentsModule {}
