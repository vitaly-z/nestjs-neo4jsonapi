import { Entity, defineEntity } from "../../../common";
import { passkeyAuthenticationOptionsMeta } from "./passkey-authentication-options.meta";

/**
 * PasskeyAuthenticationOptions Entity Type
 *
 * Transient response type for WebAuthn authentication options.
 * Not stored in database - used only for JSON:API serialization.
 */
export type PasskeyAuthenticationOptions = Entity & {
  pendingId: string;
  options: any;
};

/**
 * PasskeyAuthenticationOptions Entity Descriptor
 *
 * Used for serializing WebAuthn authentication options to JSON:API format.
 */
export const PasskeyAuthenticationOptionsDescriptor = defineEntity<PasskeyAuthenticationOptions>()({
  ...passkeyAuthenticationOptionsMeta,

  isCompanyScoped: false,

  fields: {
    pendingId: { type: "string", required: true },
    options: { type: "json", required: true },
  },

  relationships: {},
});

export type PasskeyAuthenticationOptionsDescriptorType = typeof PasskeyAuthenticationOptionsDescriptor;
