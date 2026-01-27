import { Entity, defineEntity } from "../../../common";
import { passkeyMeta } from "./passkey.meta";

/**
 * Passkey Entity Type
 *
 * Stores WebAuthn passkey data (1:N with User)
 * Relationship: User -[HAS_PASSKEY]-> Passkey
 */
export type Passkey = Entity & {
  name: string;
  credentialId: string; // base64url encoded
  publicKey: string; // base64url encoded
  counter: number;
  transports: string; // JSON array
  backedUp: boolean;
  lastUsedAt?: Date;
};

/**
 * Passkey Entity Descriptor
 *
 * Single source of truth for the Passkey entity configuration.
 * Passkey entries are NOT company-scoped - they're attached to User via relationship.
 *
 * Note: credentialId, publicKey, counter, transports are excluded from JSON:API responses for security.
 */
export const PasskeyDescriptor = defineEntity<Passkey>()({
  ...passkeyMeta,

  // Passkey entries are NOT company-scoped - they exist attached to User
  isCompanyScoped: false,

  fields: {
    name: { type: "string", required: true },
    // Security-sensitive fields excluded from JSON:API responses
    credentialId: { type: "string", required: true, excludeFromJsonApi: true },
    publicKey: { type: "string", required: true, excludeFromJsonApi: true },
    counter: { type: "number", required: true, excludeFromJsonApi: true },
    transports: { type: "string", required: true, excludeFromJsonApi: true },
    backedUp: { type: "boolean", required: true, default: false },
    lastUsedAt: { type: "datetime" },
  },

  relationships: {},
});

export type PasskeyDescriptorType = typeof PasskeyDescriptor;
