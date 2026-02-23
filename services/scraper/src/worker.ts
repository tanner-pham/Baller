import { Worker, type Job } from 'bullmq';
import { scraperConfig } from './config.js';
import { logger } from './logger.js';
import { sharedQueueConnection, SIMILAR_LISTINGS_QUEUE_NAME } from './queue.js';
import { scrapeSimilarMarketplaceListings } from './scrape/similar.js';
import { upsertSimilarJobStatus, upsertSimilarListingsCache } from './db.js';
import type { SimilarJobPayload } from './types.js';

async function processSimilarJob(job: Job<SimilarJobPayload>): Promise<{ count: number }> {
  const payload = job.data;
  const attemptCount = job.attemptsMade + 1;

  await upsertSimilarJobStatus({
    listingId: payload.listingId,
    queryHash: payload.queryHash,
    jobId: job.id ?? `similar:${payload.listingId}:${payload.queryHash}`,
    status: 'processing',
    attemptCount,
    errorMessage: null,
    completedAt: null,
  });

  const similarListings = await scrapeSimilarMarketplaceListings(payload);

  await upsertSimilarListingsCache({
    listingId: payload.listingId,
    queryHash: payload.queryHash,
    similarListings,
  });

  await upsertSimilarJobStatus({
    listingId: payload.listingId,
    queryHash: payload.queryHash,
    jobId: job.id ?? `similar:${payload.listingId}:${payload.queryHash}`,
    status: 'completed',
    attemptCount,
    errorMessage: null,
    completedAt: new Date().toISOString(),
  });

  return { count: similarListings.length };
}

const worker = new Worker<SimilarJobPayload>(SIMILAR_LISTINGS_QUEUE_NAME, processSimilarJob, {
  connection: sharedQueueConnection,
  concurrency: scraperConfig.MAX_CONCURRENCY,
});

worker.on('completed', (job, result) => {
  logger.info(
    {
      jobId: job.id,
      listingId: job.data.listingId,
      queryHash: job.data.queryHash,
      result,
    },
    'Similar-listings job completed',
  );
});

worker.on('failed', async (job, error) => {
  if (!job) {
    return;
  }

  const maxAttempts = typeof job.opts.attempts === 'number' ? job.opts.attempts : scraperConfig.MAX_ATTEMPTS;
  const didExhaustRetries = job.attemptsMade >= maxAttempts;

  try {
    await upsertSimilarJobStatus({
      listingId: job.data.listingId,
      queryHash: job.data.queryHash,
      jobId: job.id ?? `similar:${job.data.listingId}:${job.data.queryHash}`,
      status: didExhaustRetries ? 'failed' : 'pending',
      attemptCount: job.attemptsMade,
      errorMessage: error.message,
      completedAt: null,
    });
  } catch (statusError) {
    logger.error(
      {
        error: statusError,
        listingId: job.data.listingId,
        queryHash: job.data.queryHash,
      },
      'Failed to update similar job status after worker failure',
    );
  }

  logger.error(
    {
      error,
      didExhaustRetries,
      attemptsMade: job.attemptsMade,
      maxAttempts,
      listingId: job.data.listingId,
      queryHash: job.data.queryHash,
    },
    'Similar-listings job failed',
  );
});

async function shutdown(signal: string): Promise<void> {
  logger.info({ signal }, 'Shutting down similar-listings worker');
  await worker.close();
  await sharedQueueConnection.quit();
  process.exit(0);
}

process.on('SIGINT', () => {
  void shutdown('SIGINT');
});

process.on('SIGTERM', () => {
  void shutdown('SIGTERM');
});

logger.info(
  {
    queue: SIMILAR_LISTINGS_QUEUE_NAME,
    concurrency: scraperConfig.MAX_CONCURRENCY,
    maxAttempts: scraperConfig.MAX_ATTEMPTS,
  },
  'Similar-listings worker started',
);
