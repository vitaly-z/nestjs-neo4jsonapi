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
      url: "url",
      samplePhotographs: "samplePhotographs",
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

  /**
   * Generates a signed URL for S3 access
   */
  async getSignedUrl(url: string): Promise<string | undefined> {
    if (!url) return undefined;
    return await this.s3Service.generateSignedUrl({ key: url });
  }

  /**
   * Generates signed URLs for an array of S3 keys
   */
  async getSignedUrls(urls: string[]): Promise<string[]> {
    if (!urls?.length) return [];
    return Promise.all(
      urls.map((url: string) => this.s3Service.generateSignedUrl({ key: url })),
    );
  }
}
