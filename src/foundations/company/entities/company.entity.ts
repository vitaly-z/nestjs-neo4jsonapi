import { Entity } from "../../../common/abstracts/entity";
import { Feature } from "../../feature/entities/feature.entity";
import { Module } from "../../module/entities/module.entity";

export type Company = Entity & {
  name: string;
  logo?: string;
  logoUrl?: string;
  isActiveSubscription: boolean;
  ownerEmail: string;
  monthlyTokens: number;
  availableMonthlyTokens: number;
  availableExtraTokens: number;
  configurations?: string;

  feature: Feature[];
  module: Module[];
  configuration?: any;
};
