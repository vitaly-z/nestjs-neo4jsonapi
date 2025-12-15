import { Injectable } from "@nestjs/common";
import { JsonApiService } from "../../../core/jsonapi/services/jsonapi.service";
import { CommunityRepository } from "../repositories/community.repository";

@Injectable()
export class CommunityService {
  constructor(
    private readonly builder: JsonApiService,
    private readonly communityRepository: CommunityRepository,
  ) {}
}
