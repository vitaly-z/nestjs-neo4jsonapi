import { Entity } from "../../../common/abstracts/entity";
import { Module } from "../../module/entities/module.entity";

export type Feature = Entity & {
  name: string;
  isProduction: boolean;
  module: Module[];
};
