import { z } from 'zod';

export const listingFetchRequestSchema = z.object({
  listingId: z.string().trim().min(1).nullable().optional(),
  listingUrl: z.string().url(),
});

export const similarEnqueueRequestSchema = z.object({
  listingId: z.string().trim().min(1),
  listingUrl: z.string().url(),
  queryHash: z.string().trim().min(1),
  queryText: z.string().trim().min(1),
  keywords: z.array(z.string()).default([]),
  location: z.string().trim().min(1).nullable().optional(),
  minPrice: z.number().finite().nonnegative().nullable().optional(),
  maxPrice: z.number().finite().nonnegative().nullable().optional(),
});
