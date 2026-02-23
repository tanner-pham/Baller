import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { listingFetchRequestSchema, similarEnqueueRequestSchema } from './schemas.js';
import { isAuthorizedRequest } from './auth.js';
import { logger } from './logger.js';
import { scraperConfig } from './config.js';
import { scrapeMarketplaceListing } from './scrape/listing.js';
import { enqueueSimilarListingsJob } from './queue.js';
import { upsertSimilarJobStatus } from './db.js';

function sendJson(
  response: ServerResponse,
  statusCode: number,
  body: Record<string, unknown>,
): void {
  response.statusCode = statusCode;
  response.setHeader('Content-Type', 'application/json');
  response.end(JSON.stringify(body));
}

async function readJsonBody(request: IncomingMessage): Promise<unknown> {
  const chunks: Uint8Array[] = [];

  for await (const chunk of request) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }

  const bodyText = Buffer.concat(chunks).toString('utf8');

  if (!bodyText) {
    return {};
  }

  return JSON.parse(bodyText);
}

async function handleListingFetch(
  request: IncomingMessage,
  response: ServerResponse,
): Promise<void> {
  const parsedBody = listingFetchRequestSchema.safeParse(await readJsonBody(request));

  if (!parsedBody.success) {
    sendJson(response, 400, {
      success: false,
      error: 'Invalid request payload for /v1/listing/fetch',
      issues: parsedBody.error.flatten(),
    });
    return;
  }

  const { listingUrl } = parsedBody.data;

  try {
    const scrapeResult = await scrapeMarketplaceListing(listingUrl);

    sendJson(response, 200, {
      success: true,
      listing: scrapeResult.listing,
      raw: {
        source: 'internal-scraper',
        detail: scrapeResult.raw,
      },
    });
  } catch (caughtError) {
    logger.error({ error: caughtError, listingUrl }, 'Internal listing scrape failed');

    sendJson(response, 502, {
      success: false,
      error:
        caughtError instanceof Error
          ? caughtError.message
          : 'Failed to scrape listing from internal service',
    });
  }
}

async function handleSimilarEnqueue(
  request: IncomingMessage,
  response: ServerResponse,
): Promise<void> {
  const parsedBody = similarEnqueueRequestSchema.safeParse(await readJsonBody(request));

  if (!parsedBody.success) {
    sendJson(response, 400, {
      success: false,
      error: 'Invalid request payload for /v1/similar/enqueue',
      issues: parsedBody.error.flatten(),
    });
    return;
  }

  const payload = {
    listingId: parsedBody.data.listingId,
    listingUrl: parsedBody.data.listingUrl,
    queryHash: parsedBody.data.queryHash,
    queryText: parsedBody.data.queryText,
    keywords: parsedBody.data.keywords,
    location: parsedBody.data.location ?? null,
    minPrice: parsedBody.data.minPrice ?? null,
    maxPrice: parsedBody.data.maxPrice ?? null,
  };

  try {
    const enqueueResult = await enqueueSimilarListingsJob(payload);

    await upsertSimilarJobStatus({
      listingId: payload.listingId,
      queryHash: payload.queryHash,
      jobId: enqueueResult.jobId,
      status: 'pending',
      attemptCount: 0,
      errorMessage: null,
      completedAt: null,
    });

    sendJson(response, 200, {
      success: true,
      jobId: enqueueResult.jobId,
    });
  } catch (caughtError) {
    logger.error({ error: caughtError, payload }, 'Failed to enqueue similar-listings job');

    sendJson(response, 502, {
      success: false,
      error:
        caughtError instanceof Error
          ? caughtError.message
          : 'Failed to enqueue similar-listings job',
    });
  }
}

const server = createServer(async (request, response) => {
  const method = request.method ?? 'GET';
  const requestUrl = new URL(request.url ?? '/', `http://${request.headers.host ?? 'localhost'}`);

  if (method === 'GET' && requestUrl.pathname === '/health') {
    sendJson(response, 200, {
      success: true,
      status: 'ok',
    });
    return;
  }

  if (!isAuthorizedRequest(request)) {
    sendJson(response, 401, {
      success: false,
      error: 'Unauthorized request.',
    });
    return;
  }

  try {
    if (method === 'POST' && requestUrl.pathname === '/v1/listing/fetch') {
      await handleListingFetch(request, response);
      return;
    }

    if (method === 'POST' && requestUrl.pathname === '/v1/similar/enqueue') {
      await handleSimilarEnqueue(request, response);
      return;
    }

    sendJson(response, 404, {
      success: false,
      error: 'Route not found.',
    });
  } catch (caughtError) {
    logger.error({ error: caughtError }, 'Unhandled scraper API error');

    sendJson(response, 500, {
      success: false,
      error: 'Internal scraper API error',
    });
  }
});

server.listen(scraperConfig.PORT, () => {
  logger.info({ port: scraperConfig.PORT }, 'Scraper API server listening');
});
