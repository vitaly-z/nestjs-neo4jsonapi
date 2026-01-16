/**
 * TestEntity - Old-style serialiser file
 * This represents the OLD pattern before migration
 */

import { Injectable } from "@nestjs/common";
import { AbstractSerialiser, SerialiserFactory, S3Service } from "@carlonicora/nestjs-neo4jsonapi";
import { TestEntity } from "./test-entity";
import { UserModel } from "@carlonicora/nestjs-neo4jsonapi";

@Injectable()
export class TestEntitySerialiser extends AbstractSerialiser<TestEntity> {
  constructor(
    private readonly s3Service: S3Service,
    serialiserFactory: SerialiserFactory,
  ) {
    super(serialiserFactory);

    this.attributes = {
      name: "name",
      description: "description",
      url: async (data: TestEntity) => {
        if (!data.url) return undefined;
        return await this.s3Service.generateSignedUrl({ key: data.url, isPublic: true });
      },
      samplePhotographs: async (data: TestEntity) => {
        if (!data.samplePhotographs?.length) return [];
        return Promise.all(
          data.samplePhotographs.map((url: string) => this.s3Service.generateSignedUrl({ key: url, isPublic: true })),
        );
      },
      tags: "tags",
      isActive: "isActive",
      score: "score",
      createdDate: "createdDate",
    };

    this.meta = {
      position: "position",
      relevance: "relevance",
      itemCount: "itemCount",
    };

    this.relationships = {
      author: {
        data: this.serialiserFactory.create(UserModel),
      },
    };
  }
}
