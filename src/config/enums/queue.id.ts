/**
 * Queue ID configuration
 * Consumers should extend this enum with their own queue IDs
 */
export enum QueueId {
  CHUNK = "chunk",
  COMPANY = "company",
  COMMUNITY_SUMMARISER = "community-summariser",
  BILLING_WEBHOOK = "billing-webhook",
  EMAIL = "email",
}
