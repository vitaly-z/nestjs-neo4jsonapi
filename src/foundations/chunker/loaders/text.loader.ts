import { BaseDocumentLoader } from "@langchain/core/document_loaders/base";
import { Document } from "@langchain/core/documents";
import * as fs from "fs/promises";

/**
 * Custom TextLoader implementation for LangChain v1.0
 * Replaces the deprecated TextLoader from @langchain/community
 */
export class TextLoader extends BaseDocumentLoader {
  constructor(public filePath: string) {
    super();
  }

  async load(): Promise<Document[]> {
    const text = await fs.readFile(this.filePath, "utf8");
    const metadata = { source: this.filePath };
    return [new Document({ pageContent: text, metadata })];
  }
}
