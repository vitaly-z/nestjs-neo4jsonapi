import { PdfTableCell, PdfTableElement, PdfTableRow } from "../interfaces/pdf-element.interface";
import { PdfBoundingBox, PdfLayoutElement } from "../interfaces/pdf-layout.interface";

interface TableCandidate {
  elements: PdfLayoutElement[];
  boundingBox: PdfBoundingBox;
  confidence: number;
  rows: TableRow[];
  columns: TableColumn[];
}

interface TableRow {
  y: number;
  height: number;
  elements: PdfLayoutElement[];
}

interface TableColumn {
  x: number;
  width: number;
  elements: PdfLayoutElement[];
}

export class TableExtractor {
  private readonly MIN_TABLE_ROWS = 2;
  private readonly MIN_TABLE_COLUMNS = 2;
  private readonly ROW_ALIGNMENT_THRESHOLD = 5; // pixels
  private readonly COLUMN_ALIGNMENT_THRESHOLD = 10; // pixels
  private readonly CELL_SPACING_THRESHOLD = 20; // pixels

  public detectTables(elements: PdfLayoutElement[]): PdfTableElement[] {
    if (elements.length < 4) return []; // Need at least 4 elements for a 2x2 table

    // Find table candidates using different strategies
    const candidates = this.findTableCandidates(elements);

    // Validate and convert candidates to table elements
    const tables: PdfTableElement[] = [];

    for (const candidate of candidates) {
      if (this.validateTableCandidate(candidate)) {
        const table = this.convertCandidateToTable(candidate);
        if (table) {
          tables.push(table);
        }
      }
    }

    // Remove overlapping tables (keep the one with higher confidence)
    return this.removeOverlappingTables(tables);
  }

  private findTableCandidates(elements: PdfLayoutElement[]): TableCandidate[] {
    const candidates: TableCandidate[] = [];

    // Strategy 1: Grid-based detection
    const gridCandidates = this.findGridBasedCandidates(elements);
    candidates.push(...gridCandidates);

    // Strategy 2: Alignment-based detection
    const alignmentCandidates = this.findAlignmentBasedCandidates(elements);
    candidates.push(...alignmentCandidates);

    return candidates;
  }

  private findGridBasedCandidates(elements: PdfLayoutElement[]): TableCandidate[] {
    const candidates: TableCandidate[] = [];

    // Group elements by approximate Y positions (rows)
    const rowGroups = this.groupElementsByRows(elements);

    if (rowGroups.length < this.MIN_TABLE_ROWS) return candidates;

    // Check if rows have similar column structure
    const columnStructure = this.analyzeColumnStructure(rowGroups);

    if (columnStructure.isTableLike) {
      const candidate: TableCandidate = {
        elements: rowGroups.flatMap((row) => row.elements),
        boundingBox: this.calculateBoundingBox(rowGroups.flatMap((row) => row.elements)),
        confidence: columnStructure.confidence,
        rows: rowGroups,
        columns: columnStructure.columns,
      };

      candidates.push(candidate);
    }

    return candidates;
  }

  private findAlignmentBasedCandidates(elements: PdfLayoutElement[]): TableCandidate[] {
    const candidates: TableCandidate[] = [];

    // Group elements by vertical alignment (columns)
    const columnGroups = this.groupElementsByColumns(elements);

    if (columnGroups.length < this.MIN_TABLE_COLUMNS) return candidates;

    // Check if columns have similar row structure
    const rowStructure = this.analyzeRowStructure(columnGroups);

    if (rowStructure.isTableLike) {
      const candidate: TableCandidate = {
        elements: columnGroups.flatMap((col) => col.elements),
        boundingBox: this.calculateBoundingBox(columnGroups.flatMap((col) => col.elements)),
        confidence: rowStructure.confidence,
        rows: rowStructure.rows,
        columns: columnGroups,
      };

      candidates.push(candidate);
    }

    return candidates;
  }

  private groupElementsByRows(elements: PdfLayoutElement[]): TableRow[] {
    const rows: TableRow[] = [];
    const sortedElements = [...elements].sort((a, b) => a.y - b.y);

    let currentRow: PdfLayoutElement[] = [];
    let currentY = sortedElements[0]?.y || 0;

    for (const element of sortedElements) {
      // Check if element belongs to current row
      if (Math.abs(element.y - currentY) <= this.ROW_ALIGNMENT_THRESHOLD) {
        currentRow.push(element);
      } else {
        // Start new row
        if (currentRow.length > 0) {
          const rowY = Math.min(...currentRow.map((el) => el.y));
          const rowHeight = Math.max(...currentRow.map((el) => el.y + el.height)) - rowY;

          rows.push({
            y: rowY,
            height: rowHeight,
            elements: currentRow.sort((a, b) => a.x - b.x), // Sort by X position
          });
        }

        currentRow = [element];
        currentY = element.y;
      }
    }

    // Add the last row
    if (currentRow.length > 0) {
      const rowY = Math.min(...currentRow.map((el) => el.y));
      const rowHeight = Math.max(...currentRow.map((el) => el.y + el.height)) - rowY;

      rows.push({
        y: rowY,
        height: rowHeight,
        elements: currentRow.sort((a, b) => a.x - b.x),
      });
    }

    return rows;
  }

  private groupElementsByColumns(elements: PdfLayoutElement[]): TableColumn[] {
    const columns: TableColumn[] = [];
    const sortedElements = [...elements].sort((a, b) => a.x - b.x);

    let currentColumn: PdfLayoutElement[] = [];
    let currentX = sortedElements[0]?.x || 0;

    for (const element of sortedElements) {
      // Check if element belongs to current column
      if (Math.abs(element.x - currentX) <= this.COLUMN_ALIGNMENT_THRESHOLD) {
        currentColumn.push(element);
      } else {
        // Start new column
        if (currentColumn.length > 0) {
          const colX = Math.min(...currentColumn.map((el) => el.x));
          const colWidth = Math.max(...currentColumn.map((el) => el.x + el.width)) - colX;

          columns.push({
            x: colX,
            width: colWidth,
            elements: currentColumn.sort((a, b) => a.y - b.y), // Sort by Y position
          });
        }

        currentColumn = [element];
        currentX = element.x;
      }
    }

    // Add the last column
    if (currentColumn.length > 0) {
      const colX = Math.min(...currentColumn.map((el) => el.x));
      const colWidth = Math.max(...currentColumn.map((el) => el.x + el.width)) - colX;

      columns.push({
        x: colX,
        width: colWidth,
        elements: currentColumn.sort((a, b) => a.y - b.y),
      });
    }

    return columns;
  }

  private analyzeColumnStructure(rows: TableRow[]): {
    isTableLike: boolean;
    confidence: number;
    columns: TableColumn[];
  } {
    if (rows.length < this.MIN_TABLE_ROWS) {
      return { isTableLike: false, confidence: 0, columns: [] };
    }

    // Extract X positions from all rows
    const allXPositions: number[] = [];
    rows.forEach((row) => {
      row.elements.forEach((el) => allXPositions.push(el.x));
    });

    // Find common column boundaries
    const columnBoundaries = this.findColumnBoundaries(allXPositions);

    if (columnBoundaries.length < this.MIN_TABLE_COLUMNS) {
      return { isTableLike: false, confidence: 0, columns: [] };
    }

    // Check consistency across rows
    let consistency = 0;

    for (const row of rows) {
      const cellsInRow = this.assignElementsToColumns(row.elements, columnBoundaries);

      // Check how many columns have content in this row
      const occupiedColumns = cellsInRow.filter((cell) => cell.length > 0).length;
      consistency += occupiedColumns / columnBoundaries.length;
    }

    const avgConsistency = consistency / rows.length;
    const isTableLike = avgConsistency >= 0.6; // At least 60% of cells should be occupied

    // Create column structure
    const columns: TableColumn[] = [];
    for (let i = 0; i < columnBoundaries.length - 1; i++) {
      const colElements = rows.flatMap((row) =>
        row.elements.filter((el) => el.x >= columnBoundaries[i] && el.x < columnBoundaries[i + 1]),
      );

      if (colElements.length > 0) {
        columns.push({
          x: columnBoundaries[i],
          width: columnBoundaries[i + 1] - columnBoundaries[i],
          elements: colElements,
        });
      }
    }

    return {
      isTableLike,
      confidence: avgConsistency,
      columns,
    };
  }

  private analyzeRowStructure(columns: TableColumn[]): {
    isTableLike: boolean;
    confidence: number;
    rows: TableRow[];
  } {
    if (columns.length < this.MIN_TABLE_COLUMNS) {
      return { isTableLike: false, confidence: 0, rows: [] };
    }

    // Extract Y positions from all columns
    const allYPositions: number[] = [];
    columns.forEach((col) => {
      col.elements.forEach((el) => allYPositions.push(el.y));
    });

    // Find common row boundaries
    const rowBoundaries = this.findRowBoundaries(allYPositions);

    if (rowBoundaries.length < this.MIN_TABLE_ROWS) {
      return { isTableLike: false, confidence: 0, rows: [] };
    }

    // Check consistency across columns
    let consistency = 0;

    for (const column of columns) {
      const cellsInColumn = this.assignElementsToRows(column.elements, rowBoundaries);

      // Check how many rows have content in this column
      const occupiedRows = cellsInColumn.filter((cell) => cell.length > 0).length;
      consistency += occupiedRows / rowBoundaries.length;
    }

    const avgConsistency = consistency / columns.length;
    const isTableLike = avgConsistency >= 0.6;

    // Create row structure
    const rows: TableRow[] = [];
    for (let i = 0; i < rowBoundaries.length - 1; i++) {
      const rowElements = columns.flatMap((col) =>
        col.elements.filter((el) => el.y >= rowBoundaries[i] && el.y < rowBoundaries[i + 1]),
      );

      if (rowElements.length > 0) {
        rows.push({
          y: rowBoundaries[i],
          height: rowBoundaries[i + 1] - rowBoundaries[i],
          elements: rowElements,
        });
      }
    }

    return {
      isTableLike,
      confidence: avgConsistency,
      rows,
    };
  }

  private findColumnBoundaries(xPositions: number[]): number[] {
    if (xPositions.length === 0) return [];

    const uniquePositions = Array.from(new Set(xPositions)).sort((a, b) => a - b);
    const boundaries: number[] = [uniquePositions[0]];

    for (let i = 1; i < uniquePositions.length; i++) {
      const gap = uniquePositions[i] - uniquePositions[i - 1];

      if (gap >= this.COLUMN_ALIGNMENT_THRESHOLD) {
        boundaries.push(uniquePositions[i]);
      }
    }

    // Add ending boundary
    if (boundaries.length > 0) {
      const maxX = Math.max(...xPositions);
      boundaries.push(maxX + 100); // Approximate width
    }

    return boundaries;
  }

  private findRowBoundaries(yPositions: number[]): number[] {
    if (yPositions.length === 0) return [];

    const uniquePositions = Array.from(new Set(yPositions)).sort((a, b) => a - b);
    const boundaries: number[] = [uniquePositions[0]];

    for (let i = 1; i < uniquePositions.length; i++) {
      const gap = uniquePositions[i] - uniquePositions[i - 1];

      if (gap >= this.ROW_ALIGNMENT_THRESHOLD) {
        boundaries.push(uniquePositions[i]);
      }
    }

    // Add ending boundary
    if (boundaries.length > 0) {
      const maxY = Math.max(...yPositions);
      boundaries.push(maxY + 20); // Approximate height
    }

    return boundaries;
  }

  private assignElementsToColumns(elements: PdfLayoutElement[], columnBoundaries: number[]): PdfLayoutElement[][] {
    const columns: PdfLayoutElement[][] = [];

    for (let i = 0; i < columnBoundaries.length - 1; i++) {
      const columnElements = elements.filter((el) => el.x >= columnBoundaries[i] && el.x < columnBoundaries[i + 1]);
      columns.push(columnElements);
    }

    return columns;
  }

  private assignElementsToRows(elements: PdfLayoutElement[], rowBoundaries: number[]): PdfLayoutElement[][] {
    const rows: PdfLayoutElement[][] = [];

    for (let i = 0; i < rowBoundaries.length - 1; i++) {
      const rowElements = elements.filter((el) => el.y >= rowBoundaries[i] && el.y < rowBoundaries[i + 1]);
      rows.push(rowElements);
    }

    return rows;
  }

  private validateTableCandidate(candidate: TableCandidate): boolean {
    // Check minimum requirements
    if (candidate.rows.length < this.MIN_TABLE_ROWS) return false;
    if (candidate.columns.length < this.MIN_TABLE_COLUMNS) return false;
    if (candidate.confidence < 0.5) return false;

    // Check for reasonable aspect ratio
    const aspectRatio = candidate.boundingBox.width / candidate.boundingBox.height;
    if (aspectRatio < 0.1 || aspectRatio > 10) return false;

    return true;
  }

  private convertCandidateToTable(candidate: TableCandidate): PdfTableElement | null {
    try {
      const tableRows: PdfTableRow[] = [];

      for (const row of candidate.rows) {
        const cells: PdfTableCell[] = [];

        for (const column of candidate.columns) {
          // Find elements that belong to this cell (row-column intersection)
          const cellElements = row.elements.filter((el) => el.x >= column.x && el.x < column.x + column.width);

          const cellContent = cellElements
            .map((el) => el.content)
            .join(" ")
            .trim();

          const cell: PdfTableCell = {
            content: cellContent,
            x: column.x,
            y: row.y,
            width: column.width,
            height: row.height,
          };

          cells.push(cell);
        }

        if (cells.length > 0) {
          tableRows.push({
            cells,
            y: row.y,
            height: row.height,
          });
        }
      }

      const table: PdfTableElement = {
        type: "table",
        rows: tableRows,
        x: candidate.boundingBox.x,
        y: candidate.boundingBox.y,
        width: candidate.boundingBox.width,
        height: candidate.boundingBox.height,
        pageNumber: candidate.elements[0]?.pageNumber || 1,
        confidence: candidate.confidence,
      };

      return table;
    } catch (error) {
      console.error("Error converting table candidate:", error);
      return null;
    }
  }

  private removeOverlappingTables(tables: PdfTableElement[]): PdfTableElement[] {
    const result: PdfTableElement[] = [];

    for (const table of tables) {
      let isOverlapping = false;

      for (const existingTable of result) {
        if (this.tablesOverlap(table, existingTable)) {
          isOverlapping = true;

          // Keep the table with higher confidence
          if ((table.confidence || 0) > (existingTable.confidence || 0)) {
            const index = result.indexOf(existingTable);
            result[index] = table;
          }
          break;
        }
      }

      if (!isOverlapping) {
        result.push(table);
      }
    }

    return result;
  }

  private tablesOverlap(table1: PdfTableElement, table2: PdfTableElement): boolean {
    const box1 = { x: table1.x, y: table1.y, width: table1.width, height: table1.height };
    const box2 = { x: table2.x, y: table2.y, width: table2.width, height: table2.height };

    return !(
      box1.x + box1.width < box2.x ||
      box2.x + box2.width < box1.x ||
      box1.y + box1.height < box2.y ||
      box2.y + box2.height < box1.y
    );
  }

  private calculateBoundingBox(elements: PdfLayoutElement[]): PdfBoundingBox {
    if (elements.length === 0) {
      return { x: 0, y: 0, width: 0, height: 0 };
    }

    const minX = Math.min(...elements.map((el) => el.x));
    const maxX = Math.max(...elements.map((el) => el.x + el.width));
    const minY = Math.min(...elements.map((el) => el.y));
    const maxY = Math.max(...elements.map((el) => el.y + el.height));

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    };
  }
}
