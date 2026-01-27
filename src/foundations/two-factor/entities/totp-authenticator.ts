import { Entity, defineEntity } from "../../../common";
import { totpAuthenticatorMeta } from "./totp-authenticator.meta";

/**
 * TotpAuthenticator Entity Type
 *
 * Stores TOTP authenticator data (1:N with User)
 * Relationship: User -[HAS_TOTP_AUTHENTICATOR]-> TotpAuthenticator
 */
export type TotpAuthenticator = Entity & {
  name: string;
  secret: string; // AES-256-GCM encrypted
  verified: boolean;
  lastUsedAt?: Date;
};

/**
 * TotpAuthenticator Entity Descriptor
 *
 * Single source of truth for the TotpAuthenticator entity configuration.
 * TotpAuthenticator entries are NOT company-scoped - they're attached to User via relationship.
 *
 * Note: The 'secret' field is excluded from JSON:API responses for security.
 */
export const TotpAuthenticatorDescriptor = defineEntity<TotpAuthenticator>()({
  ...totpAuthenticatorMeta,

  // TotpAuthenticator entries are NOT company-scoped - they exist attached to User
  isCompanyScoped: false,

  fields: {
    name: { type: "string", required: true },
    // Note: 'secret' is intentionally excluded from JSON:API responses - never expose
    secret: { type: "string", required: true, excludeFromJsonApi: true },
    verified: { type: "boolean", required: true, default: false },
    lastUsedAt: { type: "datetime" },
  },

  relationships: {},
});

export type TotpAuthenticatorDescriptorType = typeof TotpAuthenticatorDescriptor;
