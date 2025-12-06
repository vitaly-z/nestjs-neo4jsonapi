import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { BaseConfigInterface } from "../../../config/interfaces";
import { AbstractJsonApiSerialiser } from "../../../core/jsonapi/abstracts/abstract.jsonapi.serialiser";
import { JsonApiSerialiserFactory } from "../../../core/jsonapi/factories/jsonapi.serialiser.factory";
import { JsonApiDataInterface } from "../../../core/jsonapi/interfaces/jsonapi.data.interface";
import { JsonApiServiceInterface } from "../../../core/jsonapi/interfaces/jsonapi.service.interface";
import { Chunk } from "../../chunk/entities/chunk.entity";
import { chunkMeta } from "../../chunk/entities/chunk.meta";
import { S3Service } from "../../s3/services/s3.service";

@Injectable()
export class ChunkSerialiser extends AbstractJsonApiSerialiser implements JsonApiServiceInterface {
  constructor(
    serialiserFactory: JsonApiSerialiserFactory,
    protected readonly s3Service: S3Service,
    configService: ConfigService<BaseConfigInterface>,
  ) {
    super(serialiserFactory, configService);
  }

  get type(): string {
    return chunkMeta.endpoint;
  }

  create(): JsonApiDataInterface {
    this.attributes = {
      content: "content",
      imagePath: async (data: Chunk) => {
        if (!data.imagePath) return undefined;
        return await this.s3Service.generateSignedUrl({ key: data.imagePath, ttl: 60 * 60 * 24 * 7 });
      },
    };

    this.meta = {
      nodeId: "nodeId",
      nodeType: "nodeType",
      relevance: (data: Chunk) => {
        return data.relevance ?? 0;
      },
      reason: "reason",
    };

    return super.create();
  }
}
