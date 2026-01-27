import { Entity, defineEntity } from "../../../common";
import { totpSetupMeta } from "./totp-setup.meta";

/**
 * TotpSetup Entity Type
 *
 * Transient response type for TOTP authenticator setup.
 * Not stored in database - used only for JSON:API serialization.
 */
export type TotpSetup = Entity & {
  secret: string;
  qrCodeUri: string;
  qrCodeDataUrl: string;
};

/**
 * TotpSetup Entity Descriptor
 *
 * Used for serializing TOTP setup response to JSON:API format.
 */
export const TotpSetupDescriptor = defineEntity<TotpSetup>()({
  ...totpSetupMeta,

  isCompanyScoped: false,

  fields: {
    secret: { type: "string", required: true },
    qrCodeUri: { type: "string", required: true },
    qrCodeDataUrl: { type: "string", required: true },
  },

  relationships: {},
});

export type TotpSetupDescriptorType = typeof TotpSetupDescriptor;
