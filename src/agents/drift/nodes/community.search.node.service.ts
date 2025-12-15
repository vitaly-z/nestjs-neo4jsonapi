import { Injectable } from "@nestjs/common";
import { AppLoggingService } from "../../../core/logging/services/logging.service";
import { CommunityRepository } from "../../../foundations/community/repositories/community.repository";
import { DriftContext, DriftContextState } from "../contexts/drift.context";

@Injectable()
export class CommunitySearchNodeService {
  constructor(
    private readonly communityRepository: CommunityRepository,
    private readonly logger: AppLoggingService,
  ) {}

  async execute(params: { state: typeof DriftContext.State }): Promise<Partial<DriftContextState>> {
    this.logger.debug(
      `Community Search Node: searching with topK=${params.state.topK}`,
      "CommunitySearchNodeService",
    );

    // Vector search against community summaries using HyDE embedding
    const matchedCommunities = await this.communityRepository.findByVector({
      embedding: params.state.hydeEmbedding,
      topK: params.state.topK,
    });

    this.logger.debug(`Community Search Node: found ${matchedCommunities.length} communities`, "CommunitySearchNodeService");

    if (matchedCommunities.length === 0) {
      return {
        hops: 1,
        matchedCommunities: [],
        communitySummaries: "",
        nextStep: "synthesis", // Skip to synthesis if no communities found
      };
    }

    // Format community summaries for LLM consumption
    const communitySummaries = matchedCommunities
      .map((c, i) => {
        return `### Community ${i + 1}: ${c.name}\nLevel: ${c.level} | Members: ${c.memberCount} | Rating: ${c.rating}\n\n${c.summary}`;
      })
      .join("\n\n---\n\n");

    return {
      hops: 1,
      matchedCommunities,
      communitySummaries,
      nextStep: "primer_answer",
    };
  }
}
