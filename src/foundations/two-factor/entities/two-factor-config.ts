import { Entity, defineEntity } from "../../../common";
import { twoFactorConfigMeta } from "./two-factor-config.meta";

/**
 * TwoFactorConfig Entity Type
 *
 * Stores user's 2FA enablement status (1:1 with User)
 * Relationship: User -[HAS_TWO_FACTOR_CONFIG]-> TwoFactorConfig
 */
export type TwoFactorConfig = Entity & {
  isEnabled: boolean;
  preferredMethod: string; // 'totp' | 'passkey'
  backupCodesCount: number;
};

/**
 * TwoFactorConfig Entity Descriptor
 *
 * Single source of truth for the TwoFactorConfig entity configuration.
 * TwoFactorConfig entries are NOT company-scoped - they're attached to User via relationship.
 */
export const TwoFactorConfigDescriptor = defineEntity<TwoFactorConfig>()({
  ...twoFactorConfigMeta,

  // TwoFactorConfig entries are NOT company-scoped - they exist attached to User
  isCompanyScoped: false,

  fields: {
    isEnabled: { type: "boolean", required: true, default: false },
    preferredMethod: { type: "string", required: true, default: "totp" },
    backupCodesCount: { type: "number", required: true, default: 0 },
  },

  relationships: {},
});

export type TwoFactorConfigDescriptorType = typeof TwoFactorConfigDescriptor;
