export interface PdfContentBlock {
  type: "paragraph" | "header" | "table" | "list" | "image" | "quote" | "code";
  content: string;
  metadata: PdfContentMetadata;
  structure?: PdfStructureInfo;
}

export interface PdfContentMetadata {
  pageNumber: number;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  readingOrder: number;
  confidence: number;
  source: "native" | "ocr" | "mixed";
  fontSize?: number;
  fontName?: string;
  formatting?: PdfFormatting;
}

export interface PdfStructureInfo {
  level?: number; // For headers (1-6)
  listType?: "ordered" | "unordered"; // For lists
  tableInfo?: PdfTableInfo; // For tables
  imageInfo?: PdfImageInfo; // For images
}

export interface PdfTableInfo {
  rows: number;
  columns: number;
  hasHeader: boolean;
  caption?: string;
  columnHeaders?: string[];
}

export interface PdfImageInfo {
  width: number;
  height: number;
  format?: string;
  hasText: boolean;
  extractedText?: string;
  caption?: string;
}

export interface PdfFormatting {
  isBold: boolean;
  isItalic: boolean;
  isUnderlined: boolean;
  color?: string;
  backgroundColor?: string;
  alignment?: "left" | "center" | "right" | "justify";
}

export interface PdfExtractionResult {
  contentBlocks: PdfContentBlock[];
  metadata: PdfDocumentMetadata;
  processingInfo: PdfProcessingInfo;
}

export interface PdfDocumentMetadata {
  totalPages: number;
  title?: string;
  author?: string;
  creator?: string;
  producer?: string;
  creationDate?: Date;
  modificationDate?: Date;
  subject?: string;
  keywords?: string[];
  pageSize: {
    width: number;
    height: number;
  };
  documentType: "native" | "scanned" | "mixed";
}

export interface PdfProcessingInfo {
  processingTime: number;
  ocrUsed: boolean;
  tablesDetected: number;
  imagesProcessed: number;
  confidence: number;
  warnings: string[];
  errors: string[];
}

export interface PdfChunkingOptions {
  maxChunkSize: number;
  chunkOverlap: number;
  preserveStructure: boolean;
  semanticBoundaries: boolean;
  includeMetadata: boolean;
  confidenceThreshold: number;
}
