import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from "@nestjs/terminus";
import { HeadBucketCommand, S3Client } from "@aws-sdk/client-s3";
import { BlobServiceClient } from "@azure/storage-blob";
import { BaseConfigInterface, ConfigS3Interface } from "../../../config/interfaces";

@Injectable()
export class S3HealthIndicator extends HealthIndicator {
  private readonly TIMEOUT_MS = 5000;

  constructor(private readonly config: ConfigService<BaseConfigInterface>) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      const s3Config = this.config.get<ConfigS3Interface>("s3");

      if (!s3Config || !s3Config.bucket) {
        return this.getStatus(key, true, {
          message: "S3 not configured - skipping check",
        });
      }

      const storageType = s3Config.type;

      // Create a timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("Health check timeout")), this.TIMEOUT_MS);
      });

      let checkPromise: Promise<void>;

      if (storageType === "azure") {
        checkPromise = this.checkAzure(s3Config);
      } else {
        checkPromise = this.checkS3Compatible(s3Config);
      }

      await Promise.race([checkPromise, timeoutPromise]);

      return this.getStatus(key, true, {
        message: `${storageType} storage connection healthy`,
        storageType,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      throw new HealthCheckError(
        "S3/Storage health check failed",
        this.getStatus(key, false, {
          message: errorMessage,
        }),
      );
    }
  }

  private async checkS3Compatible(s3Config: ConfigS3Interface): Promise<void> {
    const type = s3Config.type;

    let s3Client: S3Client;

    switch (type) {
      case "s3":
      case "aws":
        s3Client = new S3Client({
          region: s3Config.region,
          credentials: {
            accessKeyId: s3Config.key,
            secretAccessKey: s3Config.secret,
          },
        });
        break;
      case "digitalocean":
      case "hetzner":
        s3Client = new S3Client({
          region: s3Config.region,
          endpoint: s3Config.endpoint,
          credentials: {
            accessKeyId: s3Config.key,
            secretAccessKey: s3Config.secret,
          },
        });
        break;
      case "minio":
        s3Client = new S3Client({
          endpoint: s3Config.endpoint,
          region: "local",
          credentials: {
            accessKeyId: s3Config.key,
            secretAccessKey: s3Config.secret,
          },
          forcePathStyle: true,
        });
        break;
      default:
        throw new Error(`Unsupported storage type: ${type}`);
    }

    // HeadBucket is a lightweight operation to check bucket access
    const command = new HeadBucketCommand({ Bucket: s3Config.bucket });
    await s3Client.send(command);
    s3Client.destroy();
  }

  private async checkAzure(s3Config: ConfigS3Interface): Promise<void> {
    const connectionString = s3Config.key;
    const containerName = s3Config.bucket;

    const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
    const containerClient = blobServiceClient.getContainerClient(containerName);

    // Check if container exists - lightweight operation
    const exists = await containerClient.exists();
    if (!exists) {
      throw new Error(`Azure container '${containerName}' does not exist`);
    }
  }
}
