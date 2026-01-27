import { Entity, defineEntity } from "../../../common";
import { backupCodesGenerationMeta } from "./backup-codes-generation.meta";

/**
 * BackupCodesGeneration Entity Type
 *
 * Transient response type for backup codes generation/regeneration.
 * Not stored in database - used only for JSON:API serialization.
 */
export type BackupCodesGeneration = Entity & {
  codes: string[];
  count: number;
};

/**
 * BackupCodesGeneration Entity Descriptor
 *
 * Used for serializing backup codes generation response to JSON:API format.
 */
export const BackupCodesGenerationDescriptor = defineEntity<BackupCodesGeneration>()({
  ...backupCodesGenerationMeta,

  isCompanyScoped: false,

  fields: {
    codes: { type: "string[]", required: true },
    count: { type: "number", required: true },
  },

  relationships: {},
});

export type BackupCodesGenerationDescriptorType = typeof BackupCodesGenerationDescriptor;
