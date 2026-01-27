import { Entity, defineEntity } from "../../../common";
import { backupCodesCountMeta } from "./backup-codes-count.meta";

/**
 * BackupCodesCount Entity Type
 *
 * Transient response type for backup codes count.
 * Not stored in database - used only for JSON:API serialization.
 */
export type BackupCodesCount = Entity & {
  count: number;
};

/**
 * BackupCodesCount Entity Descriptor
 *
 * Used for serializing backup codes count response to JSON:API format.
 */
export const BackupCodesCountDescriptor = defineEntity<BackupCodesCount>()({
  ...backupCodesCountMeta,

  isCompanyScoped: false,

  fields: {
    count: { type: "number", required: true },
  },

  relationships: {},
});

export type BackupCodesCountDescriptorType = typeof BackupCodesCountDescriptor;
