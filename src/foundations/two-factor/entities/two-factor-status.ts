import { Entity, defineEntity } from "../../../common";
import { twoFactorStatusMeta } from "./two-factor-status.meta";

/**
 * TwoFactorStatus Entity Type
 *
 * Transient response type for 2FA status information.
 * Not stored in database - used only for JSON:API serialization.
 */
export type TwoFactorStatus = Entity & {
  isEnabled: boolean;
  preferredMethod: string;
  methods: {
    totp: boolean;
    passkey: boolean;
    backup: boolean;
  };
  backupCodesCount: number;
};

/**
 * TwoFactorStatus Entity Descriptor
 *
 * Used for serializing 2FA status response to JSON:API format.
 */
export const TwoFactorStatusDescriptor = defineEntity<TwoFactorStatus>()({
  ...twoFactorStatusMeta,

  isCompanyScoped: false,

  fields: {
    isEnabled: { type: "boolean", required: true },
    preferredMethod: { type: "string", required: true },
    methods: { type: "json", required: true },
    backupCodesCount: { type: "number", required: true },
  },

  relationships: {},
});

export type TwoFactorStatusDescriptorType = typeof TwoFactorStatusDescriptor;
