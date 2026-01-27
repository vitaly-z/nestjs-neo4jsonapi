import { Entity, defineEntity } from "../../../common";
import { twoFactorChallengeMeta } from "./two-factor-challenge.meta";

/**
 * TwoFactorChallenge Entity Type
 *
 * Transient response type for 2FA challenge requests.
 * Not stored in database - used only for JSON:API serialization.
 */
export type TwoFactorChallenge = Entity & {
  method: string;
  pendingId: string;
  availableMethods?: string[];
  options?: any;
};

/**
 * TwoFactorChallenge Entity Descriptor
 *
 * Used for serializing 2FA challenge response to JSON:API format.
 */
export const TwoFactorChallengeDescriptor = defineEntity<TwoFactorChallenge>()({
  ...twoFactorChallengeMeta,

  isCompanyScoped: false,

  fields: {
    method: { type: "string", required: true },
    pendingId: { type: "string", required: true },
    availableMethods: { type: "string[]" },
    options: { type: "json" },
  },

  relationships: {},
});

export type TwoFactorChallengeDescriptorType = typeof TwoFactorChallengeDescriptor;
