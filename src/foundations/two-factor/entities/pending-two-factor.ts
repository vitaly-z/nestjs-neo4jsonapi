import { Entity, defineEntity } from "../../../common";
import { pendingTwoFactorMeta } from "./pending-two-factor.meta";

/**
 * PendingTwoFactor Entity Type
 *
 * Stores pending 2FA challenge data (1:1 with User, temporary)
 * Relationship: User -[HAS_PENDING_TWO_FACTOR]-> PendingTwoFactor
 */
export type PendingTwoFactor = Entity & {
  challenge: string;
  challengeType: string; // 'totp' | 'passkey' | 'backup'
  expiration: Date;
  attemptCount: number;
};

/**
 * PendingTwoFactor Entity Descriptor
 *
 * Single source of truth for the PendingTwoFactor entity configuration.
 * PendingTwoFactor entries are NOT company-scoped - they're attached to User via relationship.
 *
 * Note: challenge is excluded from JSON:API responses - internal security data.
 */
export const PendingTwoFactorDescriptor = defineEntity<PendingTwoFactor>()({
  ...pendingTwoFactorMeta,

  // PendingTwoFactor entries are NOT company-scoped - they exist attached to User
  isCompanyScoped: false,

  fields: {
    // challenge is excluded from JSON:API responses - internal security data
    challenge: { type: "string", required: true, excludeFromJsonApi: true },
    challengeType: { type: "string", required: true },
    expiration: { type: "datetime", required: true },
    attemptCount: { type: "number", required: true, default: 0 },
  },

  relationships: {},
});

export type PendingTwoFactorDescriptorType = typeof PendingTwoFactorDescriptor;
