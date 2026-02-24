"use client";

import { useState, useEffect } from 'react';
import type { SimilarListing } from '../(components)/SimilarListings';

interface UseSimilarListingsParams {
  query?: string;
  targetPrice?: number;
  enabled?: boolean;
}

interface SimilarListingsResponse {
  success: boolean;
  query: string;
  count: number;
  listings: (SimilarListing & { similarityScore: number })[];
}

export function useSimilarListings({ query, targetPrice, enabled = true }: UseSimilarListingsParams) {
  const [listings, setListings] = useState<SimilarListing[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || !query) {
      return;
    }

    const fetchSimilarListings = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          query,
          maxResults: '10',
        });

        if (targetPrice && targetPrice > 0) {
          params.append('targetPrice', targetPrice.toString());
        }

        const response = await fetch(`/api/similar-listings?${params.toString()}`);

        if (!response.ok) {
          throw new Error('Failed to fetch similar listings');
        }

        const data: SimilarListingsResponse = await response.json();
        
        // Remove similarityScore from listings before setting state
        const cleanedListings = data.listings.map(({ similarityScore, ...listing }) => listing);
        setListings(cleanedListings);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        console.error('Similar listings fetch error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSimilarListings();
  }, [query, targetPrice, enabled]);

  return { listings, isLoading, error };
}