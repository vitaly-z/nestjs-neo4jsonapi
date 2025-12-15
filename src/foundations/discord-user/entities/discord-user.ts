import { defineEntity, Entity } from "../../../common";
import { Company } from "../../company";
import { User, userMeta } from "../../user";

export type DiscordUser = Entity & {
  name: string;
  discordId: string;

  company: Company;
  user: User;
};

export const DiscordUserDescriptor = defineEntity<DiscordUser>()({
  // Meta properties
  type: "discordusers",
  endpoint: "discordusers",
  nodeName: "discorduser",
  labelName: "DiscordUser",

  // Field definitions
  fields: {
    name: { type: "string", required: true },
    discordId: { type: "string", required: true },
  },

  relationships: {
    user: {
      model: userMeta,
      direction: "in",
      relationship: "HAS_DISCORD",
      cardinality: "one",
      dtoKey: "users",
      contextKey: "userId",
    },
  },
});

// Type export for the descriptor
export type DiscordUserDescriptorType = typeof DiscordUserDescriptor;
