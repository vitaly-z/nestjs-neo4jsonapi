import { Entity, defineEntity } from "../../../common";
import { twoFactorVerificationMeta } from "./two-factor-verification.meta";

/**
 * TwoFactorVerification Entity Type
 *
 * Transient response type for 2FA verification results.
 * Not stored in database - used only for JSON:API serialization.
 */
export type TwoFactorVerification = Entity & {
  success: boolean;
  userId?: string;
};

/**
 * TwoFactorVerification Entity Descriptor
 *
 * Used for serializing 2FA verification response to JSON:API format.
 */
export const TwoFactorVerificationDescriptor = defineEntity<TwoFactorVerification>()({
  ...twoFactorVerificationMeta,

  isCompanyScoped: false,

  fields: {
    success: { type: "boolean", required: true },
    userId: { type: "string" },
  },

  relationships: {},
});

export type TwoFactorVerificationDescriptorType = typeof TwoFactorVerificationDescriptor;
