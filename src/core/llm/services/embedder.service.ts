import { Injectable } from "@nestjs/common";
import { ModelService } from "../../llm/services/model.service";

@Injectable()
export class EmbedderService {
  constructor(private readonly modelService: ModelService) {}

  async vectoriseText(params: { text: string }): Promise<any> {
    return this.modelService.getEmbedder().embedQuery(params.text);
  }

  async vectoriseTextBatch(texts: string[]): Promise<any[]> {
    return this.modelService.getEmbedder().embedDocuments(texts);
  }
}
