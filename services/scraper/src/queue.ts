import IORedis from 'ioredis';
import { Queue } from 'bullmq';
import { scraperConfig } from './config.js';
import type { SimilarJobPayload } from './types.js';

const redisConnection = new IORedis(scraperConfig.REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

export const SIMILAR_LISTINGS_QUEUE_NAME = 'similar-listings';

export const similarListingsQueue = new Queue<SimilarJobPayload>(SIMILAR_LISTINGS_QUEUE_NAME, {
  connection: redisConnection,
});

/**
 * Enqueues one similar-listings job with deterministic dedupe id.
 */
export async function enqueueSimilarListingsJob(payload: SimilarJobPayload): Promise<{ jobId: string }> {
  const jobId = `similar:${payload.listingId}:${payload.queryHash}`;

  await similarListingsQueue.add('search', payload, {
    jobId,
    attempts: scraperConfig.MAX_ATTEMPTS,
    backoff: {
      type: 'exponential',
      delay: 30000,
    },
    removeOnComplete: 100,
    removeOnFail: 100,
  });

  return { jobId };
}

export const sharedQueueConnection = redisConnection;
