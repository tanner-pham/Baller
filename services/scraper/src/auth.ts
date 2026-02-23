import type { IncomingMessage } from 'node:http';
import { scraperConfig } from './config.js';

/**
 * Authenticates internal scraper requests with a shared bearer token.
 */
export function isAuthorizedRequest(request: IncomingMessage): boolean {
  const authorizationHeader = request.headers.authorization;

  if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
    return false;
  }

  const token = authorizationHeader.slice('Bearer '.length).trim();
  return token.length > 0 && token === scraperConfig.INTERNAL_TOKEN;
}
