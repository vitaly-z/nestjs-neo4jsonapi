import { defineEntity, Entity } from "../../../common";
import { Company } from "../../company";
import { User, userMeta } from "../../user";

export type Discord = Entity & {
  name: string;
  discordId: string;

  company: Company;
  user: User;
};

export const DiscordDescriptor = defineEntity<Discord>()({
  // Meta properties
  type: "discords",
  endpoint: "discords",
  nodeName: "discord",
  labelName: "Discord",

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
export type DiscordDescriptorType = typeof DiscordDescriptor;
