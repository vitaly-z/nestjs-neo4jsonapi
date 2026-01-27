import { Entity, defineEntity } from "../../../common";
import { backupCodeMeta } from "./backup-code.meta";

/**
 * BackupCode Entity Type
 *
 * Stores backup code data (1:N with User, max 10)
 * Relationship: User -[HAS_BACKUP_CODE]-> BackupCode
 */
export type BackupCode = Entity & {
  codeHash: string; // bcrypt hash
  usedAt?: Date;
};

/**
 * BackupCode Entity Descriptor
 *
 * Single source of truth for the BackupCode entity configuration.
 * BackupCode entries are NOT company-scoped - they're attached to User via relationship.
 *
 * Note: codeHash is excluded from JSON:API responses - never expose.
 */
export const BackupCodeDescriptor = defineEntity<BackupCode>()({
  ...backupCodeMeta,

  // BackupCode entries are NOT company-scoped - they exist attached to User
  isCompanyScoped: false,

  fields: {
    // codeHash is excluded from JSON:API responses - never expose
    codeHash: { type: "string", required: true, excludeFromJsonApi: true },
    usedAt: { type: "datetime" },
  },

  relationships: {},
});

export type BackupCodeDescriptorType = typeof BackupCodeDescriptor;
