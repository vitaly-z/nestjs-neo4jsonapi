import { BaseDocumentLoader } from "@langchain/core/document_loaders/base";
import { Document } from "@langchain/core/documents";
import * as fs from "fs/promises";

/**
 * Custom JSONLoader implementation for LangChain v1.0
 * Replaces the deprecated JSONLoader from @langchain/community
 */
export class JSONLoader extends BaseDocumentLoader {
  constructor(
    public filePath: string,
    public pointer: string = "",
  ) {
    super();
  }

  async load(): Promise<Document[]> {
    const text = await fs.readFile(this.filePath, "utf8");
    const json = JSON.parse(text);

    // If pointer is provided, navigate to that property
    let data = json;
    if (this.pointer) {
      const keys = this.pointer.split("/").filter((k) => k);
      for (const key of keys) {
        data = data?.[key];
      }
    }

    const metadata = { source: this.filePath };

    // If data is an array, create a document for each item
    if (Array.isArray(data)) {
      return data.map(
        (item, i) =>
          new Document({
            pageContent: typeof item === "string" ? item : JSON.stringify(item),
            metadata: { ...metadata, line: i },
          }),
      );
    }

    // Otherwise, create a single document
    return [
      new Document({
        pageContent: typeof data === "string" ? data : JSON.stringify(data),
        metadata,
      }),
    ];
  }
}

/**
 * Custom JSONLinesLoader implementation for LangChain v1.0
 * Replaces the deprecated JSONLinesLoader from @langchain/community
 */
export class JSONLinesLoader extends BaseDocumentLoader {
  constructor(
    public filePath: string,
    public pointer: string = "",
  ) {
    super();
  }

  async load(): Promise<Document[]> {
    const text = await fs.readFile(this.filePath, "utf8");
    const lines = text
      .split("\n")
      .filter((line) => line.trim())
      .map((line) => JSON.parse(line));

    const metadata = { source: this.filePath };

    return lines.map((json, i) => {
      // If pointer is provided, navigate to that property
      let data = json;
      if (this.pointer) {
        const keys = this.pointer.split("/").filter((k) => k);
        for (const key of keys) {
          data = data?.[key];
        }
      }

      return new Document({
        pageContent: typeof data === "string" ? data : JSON.stringify(data),
        metadata: { ...metadata, line: i },
      });
    });
  }
}
