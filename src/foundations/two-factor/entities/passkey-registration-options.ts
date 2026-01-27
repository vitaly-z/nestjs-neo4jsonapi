import { Entity, defineEntity } from "../../../common";
import { passkeyRegistrationOptionsMeta } from "./passkey-registration-options.meta";

/**
 * PasskeyRegistrationOptions Entity Type
 *
 * Transient response type for WebAuthn registration options.
 * Not stored in database - used only for JSON:API serialization.
 */
export type PasskeyRegistrationOptions = Entity & {
  pendingId: string;
  options: any;
};

/**
 * PasskeyRegistrationOptions Entity Descriptor
 *
 * Used for serializing WebAuthn registration options to JSON:API format.
 */
export const PasskeyRegistrationOptionsDescriptor = defineEntity<PasskeyRegistrationOptions>()({
  ...passkeyRegistrationOptionsMeta,

  isCompanyScoped: false,

  fields: {
    pendingId: { type: "string", required: true },
    options: { type: "json", required: true },
  },

  relationships: {},
});

export type PasskeyRegistrationOptionsDescriptorType = typeof PasskeyRegistrationOptionsDescriptor;
