import { Module } from "@nestjs/common";
import { BlockNoteService } from "./services/blocknote.service";

/**
 * BlockNote Module
 *
 * Provides BlockNote/ProseMirror to Markdown conversion utilities
 *
 * Features:
 * - Convert BlockNote JSON to Markdown
 * - Convert Markdown to BlockNote JSON
 * - Support for rich text formatting
 * - Support for lists and code blocks
 *
 * @example
 * ```typescript
 * @Module({
 *   imports: [BlockNoteModule],
 * })
 * export class AppModule {}
 * ```
 */
@Module({
  providers: [BlockNoteService],
  exports: [BlockNoteService],
})
export class BlockNoteModule {}
