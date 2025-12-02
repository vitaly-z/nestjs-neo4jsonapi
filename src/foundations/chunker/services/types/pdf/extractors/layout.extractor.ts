import { PdfColumn, PdfLayoutElement, PdfPage, PdfRegion, PdfTextLine } from "../interfaces/pdf-layout.interface";

export class LayoutExtractor {
  private readonly LINE_HEIGHT_THRESHOLD = 1.5;
  private readonly PARAGRAPH_GAP_THRESHOLD = 2.0;
  private readonly COLUMN_GAP_THRESHOLD = 20;
  private readonly HEADER_FONT_SIZE_RATIO = 1.2;

  public analyzePageLayout(elements: PdfLayoutElement[], pageWidth: number, pageHeight: number): PdfPage {
    if (elements.length === 0) {
      return {
        pageNumber: elements[0]?.pageNumber || 1,
        width: pageWidth,
        height: pageHeight,
        elements: [],
      };
    }

    // Sort elements by reading order
    const sortedElements = this.sortElementsByReadingOrder(elements);

    // Detect columns
    const columns = this.detectColumns(sortedElements, pageWidth, pageHeight);

    // Detect regions (header, footer, content)
    const regions = this.detectPageRegions(sortedElements, pageWidth, pageHeight);

    return {
      pageNumber: elements[0].pageNumber,
      width: pageWidth,
      height: pageHeight,
      elements: sortedElements,
      columns,
      headerRegion: regions.header,
      footerRegion: regions.footer,
      contentRegion: regions.content,
    };
  }

  private sortElementsByReadingOrder(elements: PdfLayoutElement[]): PdfLayoutElement[] {
    return elements.sort((a, b) => {
      // Primary sort: Y position (top to bottom)
      const yDiff = a.y - b.y;
      if (Math.abs(yDiff) > 5) {
        return yDiff;
      }
      // Secondary sort: X position (left to right) for elements on same line
      return a.x - b.x;
    });
  }

  public detectColumns(elements: PdfLayoutElement[], pageWidth: number, pageHeight: number): PdfColumn[] {
    if (elements.length === 0) return [];

    // Group elements by approximate X positions
    const xPositions = elements.map((el) => el.x).sort((a, b) => a - b);
    const columnStarts: number[] = [];

    // Find significant gaps in X positions that might indicate columns
    for (let i = 1; i < xPositions.length; i++) {
      const gap = xPositions[i] - xPositions[i - 1];
      if (gap > this.COLUMN_GAP_THRESHOLD) {
        if (!columnStarts.includes(xPositions[i - 1])) {
          columnStarts.push(xPositions[i - 1]);
        }
        if (!columnStarts.includes(xPositions[i])) {
          columnStarts.push(xPositions[i]);
        }
      }
    }

    if (columnStarts.length === 0) {
      // Single column layout
      return [
        {
          x: 0,
          y: 0,
          width: pageWidth,
          height: pageHeight,
          elements,
          columnIndex: 0,
        },
      ];
    }

    // Create columns based on detected starts
    const columns: PdfColumn[] = [];
    columnStarts.sort((a, b) => a - b);

    for (let i = 0; i < columnStarts.length; i++) {
      const columnStart = columnStarts[i];
      const columnEnd = i < columnStarts.length - 1 ? columnStarts[i + 1] : pageWidth;

      const columnElements = elements.filter((el) => el.x >= columnStart && el.x < columnEnd);

      if (columnElements.length > 0) {
        columns.push({
          x: columnStart,
          y: 0,
          width: columnEnd - columnStart,
          height: pageHeight,
          elements: columnElements,
          columnIndex: i,
        });
      }
    }

    return columns;
  }

  private detectPageRegions(
    elements: PdfLayoutElement[],
    pageWidth: number,
    pageHeight: number,
  ): {
    header?: PdfRegion;
    footer?: PdfRegion;
    content?: PdfRegion;
  } {
    if (elements.length === 0) return {};

    // Detect header region (top 15% of page)
    const headerThreshold = pageHeight * 0.15;
    const headerElements = elements.filter((el) => el.y <= headerThreshold);

    // Detect footer region (bottom 15% of page)
    const footerThreshold = pageHeight * 0.85;
    const footerElements = elements.filter((el) => el.y >= footerThreshold);

    const regions: { header?: PdfRegion; footer?: PdfRegion; content?: PdfRegion } = {};

    if (headerElements.length > 0) {
      const maxY = Math.max(...headerElements.map((el) => el.y + el.height));
      regions.header = {
        x: 0,
        y: 0,
        width: pageWidth,
        height: maxY,
        type: "header",
      };
    }

    if (footerElements.length > 0) {
      const minY = Math.min(...footerElements.map((el) => el.y));
      regions.footer = {
        x: 0,
        y: minY,
        width: pageWidth,
        height: pageHeight - minY,
        type: "footer",
      };
    }

    // Content region is everything between header and footer
    const contentY = regions.header ? regions.header.height : 0;
    const contentHeight = (regions.footer ? regions.footer.y : pageHeight) - contentY;

    regions.content = {
      x: 0,
      y: contentY,
      width: pageWidth,
      height: contentHeight,
      type: "content",
    };

    return regions;
  }

  private groupIntoTextLines(elements: PdfLayoutElement[]): PdfTextLine[] {
    if (elements.length === 0) return [];

    const lines: PdfTextLine[] = [];
    const processed = new Set<string>();

    for (const element of elements) {
      if (processed.has(element.elementId)) continue;

      // Find all elements on the same line
      const lineElements = elements.filter((el) => {
        if (processed.has(el.elementId)) return false;

        // Check if elements are on the same horizontal line
        const yDiff = Math.abs(el.y - element.y);
        const avgHeight = (el.height + element.height) / 2;

        return yDiff < avgHeight * 0.3; // Within 30% of average height
      });

      // Sort line elements by X position
      lineElements.sort((a, b) => a.x - b.x);

      // Calculate bounding box for the line
      const minX = Math.min(...lineElements.map((el) => el.x));
      const maxX = Math.max(...lineElements.map((el) => el.x + el.width));
      const minY = Math.min(...lineElements.map((el) => el.y));
      const maxY = Math.max(...lineElements.map((el) => el.y + el.height));

      const line: PdfTextLine = {
        elements: lineElements,
        boundingBox: {
          x: minX,
          y: minY,
          width: maxX - minX,
          height: maxY - minY,
        },
        baseline: minY, // Simplified baseline calculation
        lineHeight: maxY - minY,
        readingOrder: lines.length,
      };

      lines.push(line);

      // Mark elements as processed
      lineElements.forEach((el) => processed.add(el.elementId));
    }

    return lines;
  }

  public detectReadingOrder(elements: PdfLayoutElement[]): PdfLayoutElement[] {
    // This is a simplified reading order detection
    // In a full implementation, this would handle complex layouts with columns, etc.

    return elements.sort((a, b) => {
      // Primary sort: Y position (top to bottom)
      const yDiff = a.y - b.y;
      if (Math.abs(yDiff) > 10) {
        return yDiff;
      }

      // Secondary sort: X position (left to right)
      return a.x - b.x;
    });
  }
}
