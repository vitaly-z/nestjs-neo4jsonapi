export interface PdfPage {
  pageNumber: number;
  width: number;
  height: number;
  elements: PdfLayoutElement[];
  columns?: PdfColumn[];
  headerRegion?: PdfRegion;
  footerRegion?: PdfRegion;
  contentRegion?: PdfRegion;
}

export interface PdfLayoutElement {
  x: number;
  y: number;
  width: number;
  height: number;
  content: string;
  fontSize: number;
  fontName: string;
  fontWeight?: string;
  isItalic?: boolean;
  isBold?: boolean;
  color?: string;
  backgroundColor?: string;
  pageNumber: number;
  elementId: string;
  confidence?: number;
}

export interface PdfColumn {
  x: number;
  y: number;
  width: number;
  height: number;
  elements: PdfLayoutElement[];
  columnIndex: number;
}

export interface PdfRegion {
  x: number;
  y: number;
  width: number;
  height: number;
  type: "header" | "footer" | "content" | "sidebar" | "margin";
}

export interface PdfBoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PdfTextLine {
  elements: PdfLayoutElement[];
  boundingBox: PdfBoundingBox;
  baseline: number;
  lineHeight: number;
  readingOrder: number;
}

export interface PdfBlock {
  type: "text" | "table" | "image" | "header" | "list" | "paragraph";
  elements: PdfLayoutElement[];
  boundingBox: PdfBoundingBox;
  lines?: PdfTextLine[];
  readingOrder: number;
  confidence: number;
}

export interface PdfDocumentStructure {
  pages: PdfPage[];
  totalPages: number;
  documentType?: "single_column" | "multi_column" | "mixed" | "table_heavy" | "scanned";
  hasImages: boolean;
  hasTables: boolean;
  hasScannedContent: boolean;
  confidence: number;
}

export interface PdfProcessingOptions {
  enableOCR: boolean;
  ocrConfidenceThreshold: number;
  ocrLanguage?: string;
  ocrImagePreprocessing?: boolean;
  detectTables: boolean;
  detectImages: boolean;
  detectHeaders: boolean;
  preserveLayout: boolean;
  maxImageSize: number;
  skipHeaderFooter: boolean;
  columnDetection: boolean;
}
