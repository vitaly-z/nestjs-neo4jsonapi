/**
 * Configuration for chunk processing queues.
 *
 * The library always registers its own CHUNK queue.
 * Use this interface to register additional queues that the ChunkService
 * needs to add jobs to after processing chunks.
 */
export interface ConfigChunkQueuesInterface {
  /**
   * Additional queue IDs for BullMQ registration.
   * These are queues that ChunkService will add jobs to after chunk processing.
   * The library's CHUNK queue is always registered automatically.
   */
  queueIds?: string[];
}
