import { Injectable } from "@nestjs/common";
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from "@nestjs/terminus";
import { Neo4jService } from "../../neo4j/services/neo4j.service";

@Injectable()
export class Neo4jHealthIndicator extends HealthIndicator {
  private readonly TIMEOUT_MS = 3000;

  constructor(private readonly neo4jService: Neo4jService) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      // Create a timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("Health check timeout")), this.TIMEOUT_MS);
      });

      // Execute simple query to verify connection
      const checkPromise = this.neo4jService.read("RETURN 1 as result", {});

      // Race between query and timeout
      await Promise.race([checkPromise, timeoutPromise]);

      return this.getStatus(key, true, {
        message: "Neo4j connection healthy",
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      throw new HealthCheckError(
        "Neo4j health check failed",
        this.getStatus(key, false, {
          message: errorMessage,
        }),
      );
    }
  }
}
