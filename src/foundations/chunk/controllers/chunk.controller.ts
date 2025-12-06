import { Controller, Get, Param, UseGuards } from "@nestjs/common";

import { JwtAuthGuard } from "../../../common/guards/jwt.auth.guard";
import { chunkMeta } from "../../chunk/entities/chunk.meta";
import { ChunkService } from "../../chunk/services/chunk.service";

@Controller()
export class ChunkController {
  constructor(private readonly chunkService: ChunkService) {}

  @UseGuards(JwtAuthGuard)
  @Get(`${chunkMeta.endpoint}/:chunkId`)
  async findById(@Param("chunkId") chunkId: string) {
    return await this.chunkService.findById({ chunkId: chunkId });
  }
}
