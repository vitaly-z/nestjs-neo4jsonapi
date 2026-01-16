/**
 * ComplexEntity - Old-style serialiser file
 * This represents the OLD pattern before migration
 * Has multiple relationships and meta fields
 */

import { Injectable } from "@nestjs/common";
import { AbstractSerialiser, SerialiserFactory } from "@carlonicora/nestjs-neo4jsonapi";
import { ComplexEntity } from "./complex-entity";
import { UserModel } from "@carlonicora/nestjs-neo4jsonapi";
import { CompanyModel } from "@carlonicora/nestjs-neo4jsonapi";

// Mock ItemModel for relationships
const ItemModel = { type: "items", endpoint: "items" };

@Injectable()
export class ComplexEntitySerialiser extends AbstractSerialiser<ComplexEntity> {
  constructor(serialiserFactory: SerialiserFactory) {
    super(serialiserFactory);

    this.attributes = {
      name: "name",
      description: "description",
      tags: "tags",
      priority: "priority",
      isPublished: "isPublished",
      publishedAt: "publishedAt",
    };

    this.meta = {
      position: "position",
      totalScore: "totalScore",
      itemCount: "itemCount",
    };

    this.relationships = {
      author: {
        data: this.serialiserFactory.create(UserModel),
      },
      company: {
        data: this.serialiserFactory.create(CompanyModel),
      },
      items: {
        name: "items",
        data: this.serialiserFactory.create(ItemModel),
      },
    };
  }
}
