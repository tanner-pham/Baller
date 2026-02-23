import pino from 'pino';
import { scraperConfig } from './config.js';

export const logger = pino({
  level: scraperConfig.LOG_LEVEL,
  base: {
    service: 'marketplace-scraper',
  },
});
