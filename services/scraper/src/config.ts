import { config as loadDotenv } from 'dotenv';
import { z } from 'zod';

loadDotenv();

const envSchema = z.object({
  SCRAPER_INTERNAL_TOKEN: z.string().min(1),
  REDIS_URL: z.string().url(),
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  SCRAPER_PORT: z.string().optional().default('4010'),
  SCRAPER_MAX_CONCURRENCY: z.string().optional().default('2'),
  SCRAPER_MAX_ATTEMPTS: z.string().optional().default('3'),
  SIMILAR_CACHE_TTL_HOURS: z.string().optional().default('12'),
  SCRAPER_LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
    .optional()
    .default('info'),
});

const parsedEnv = envSchema.parse(process.env);

export const scraperConfig = {
  INTERNAL_TOKEN: parsedEnv.SCRAPER_INTERNAL_TOKEN,
  REDIS_URL: parsedEnv.REDIS_URL,
  SUPABASE_URL: parsedEnv.SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY: parsedEnv.SUPABASE_SERVICE_ROLE_KEY,
  PORT: Number(parsedEnv.SCRAPER_PORT),
  MAX_CONCURRENCY: Number(parsedEnv.SCRAPER_MAX_CONCURRENCY),
  MAX_ATTEMPTS: Number(parsedEnv.SCRAPER_MAX_ATTEMPTS),
  SIMILAR_CACHE_TTL_HOURS: Number(parsedEnv.SIMILAR_CACHE_TTL_HOURS),
  LOG_LEVEL: parsedEnv.SCRAPER_LOG_LEVEL,
} as const;
