import { defineEntity, Entity } from "../../../common";
import { Company } from "../../company";
import { User, userMeta } from "../../user";

export type GoogleUser = Entity & {
  name: string;
  googleId: string;

  company: Company;
  user: User;
};

export const GoogleUserDescriptor = defineEntity<GoogleUser>()({
  // Meta properties
  type: "googleusers",
  endpoint: "googleusers",
  nodeName: "googleuser",
  labelName: "GoogleUser",

  // Field definitions
  fields: {
    name: { type: "string", required: true },
    googleId: { type: "string", required: true },
  },

  relationships: {
    user: {
      model: userMeta,
      direction: "in",
      relationship: "HAS_GOOGLE",
      cardinality: "one",
      dtoKey: "users",
      contextKey: "userId",
    },
  },
});

// Type export for the descriptor
export type GoogleUserDescriptorType = typeof GoogleUserDescriptor;
