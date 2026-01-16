/**
 * SimpleEntity - Old-style serialiser file
 * This represents the OLD pattern before migration
 * No S3Service, no relationships - basic serialiser
 */

import { Injectable } from "@nestjs/common";
import { AbstractSerialiser, SerialiserFactory } from "@carlonicora/nestjs-neo4jsonapi";
import { SimpleEntity } from "./simple-entity";

@Injectable()
export class SimpleEntitySerialiser extends AbstractSerialiser<SimpleEntity> {
  constructor(serialiserFactory: SerialiserFactory) {
    super(serialiserFactory);

    this.attributes = {
      title: "title",
      description: "description",
      count: "count",
      isActive: "isActive",
      createdAt: "createdAt",
    };
  }
}
