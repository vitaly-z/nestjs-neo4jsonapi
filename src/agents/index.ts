// Centralized AgentsModule - prompts configured via baseConfig.prompts
export { AgentsModule } from "./agents.modules";

// Default prompts for reference
export * from "./prompts";

// Contextualiser (GraphRAG)
export { ContextualiserModule } from "./contextualiser/contextualiser.module";
export { ContextualiserService } from "./contextualiser/services/contextualiser.service";
export { ContextualiserContextFactoryService } from "./contextualiser/factories/contextualiser.context.factory";
export { ContextualiserResponseInterface } from "./contextualiser/interfaces/contextualiser.response.interface";

// Graph Creator
export { GraphCreatorModule } from "./graph.creator/graph.creator.module";
export { GraphCreatorService } from "./graph.creator/services/graph.creator.service";
export { ChunkAnalysisInterface } from "./graph.creator/interfaces/chunk.analysis.interface";

// Responder
export { ResponderModule } from "./responder/responder.module";
export { ResponderService } from "./responder/services/responder.service";
export { ResponderResponseInterface } from "./responder/interfaces/responder.response.interface";

// Summariser
export { SummariserModule } from "./summariser/summariser.module";
export { SummariserService } from "./summariser/services/summariser.service";
