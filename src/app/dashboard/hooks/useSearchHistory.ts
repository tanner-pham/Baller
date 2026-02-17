"use client";

import { useEffect, useState } from 'react';
import type { FacebookMarketplaceListing } from '../../../lib/facebookMarketplaceListing';
import { getSupabaseBrowserClient } from '../../../lib/supabaseBrowserClient';
import type { SearchHistoryEntry } from '../types';

const MAX_HISTORY_ENTRIES = 25;

interface UseSearchHistoryOptions {
  userId: string | null;
  parsedListing: FacebookMarketplaceListing | null;
  listingTitle?: string;
}

interface UseSearchHistoryResult {
  searchHistory: SearchHistoryEntry[];
}

interface UserListingHistoryRow {
  listing_id: string;
  listing_url: string;
  listing_title: string;
  last_searched_at: string;
}

/**
 * Maps DB history rows into dashboard display entries.
 */
function mapRowToSearchHistoryEntry(row: UserListingHistoryRow): SearchHistoryEntry {
  return {
    itemId: row.listing_id,
    url: row.listing_url,
    listingTitle: row.listing_title,
    searchedAt: row.last_searched_at,
  };
}

/**
 * Manages authenticated user listing history in Supabase for cross-device access.
 */
export function useSearchHistory({
  userId,
  parsedListing,
  listingTitle,
}: UseSearchHistoryOptions): UseSearchHistoryResult {
  const [searchHistory, setSearchHistory] = useState<SearchHistoryEntry[]>([]);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();

    /**
     * Loads the latest rows for the current user from DB-backed history.
     */
    const loadSearchHistory = async () => {
      if (!userId || !supabase) {
        setSearchHistory([]);
        return;
      }

      const { data, error } = await supabase
        .from('user_listing_history')
        .select('listing_id, listing_url, listing_title, last_searched_at')
        .eq('user_id', userId)
        .order('last_searched_at', { ascending: false })
        .limit(MAX_HISTORY_ENTRIES);

      if (error) {
        console.error('Failed to load user listing history from DB', {
          userId,
          error,
        });
        setSearchHistory([]);
        return;
      }

      const rows = (data ?? []) as UserListingHistoryRow[];
      setSearchHistory(rows.map(mapRowToSearchHistoryEntry));
    };

    loadSearchHistory().catch((caughtError) => {
      console.error('Unexpected failure while loading user listing history', {
        userId,
        error: caughtError,
      });
      setSearchHistory([]);
    });
  }, [userId]);

  useEffect(() => {
    if (!userId || !parsedListing) {
      return;
    }

    const supabase = getSupabaseBrowserClient();

    if (!supabase) {
      return;
    }

    /**
     * Upserts latest lookup metadata and mirrors the update in local component state.
     */
    const persistCurrentSearchToDatabase = async () => {
      const searchedAt = new Date().toISOString();
      const resolvedListingTitle = listingTitle?.trim() || `Item ${parsedListing.itemId}`;

      const { error } = await supabase.from('user_listing_history').upsert(
        {
          user_id: userId,
          listing_id: parsedListing.itemId,
          listing_url: parsedListing.normalizedUrl,
          listing_title: resolvedListingTitle,
          last_searched_at: searchedAt,
        },
        { onConflict: 'user_id,listing_id' },
      );

      if (error) {
        console.error('Failed to persist user listing history to DB', {
          userId,
          listingId: parsedListing.itemId,
          error,
        });
        return;
      }

      setSearchHistory((previousHistory) => {
        const deduplicatedHistory = previousHistory.filter(
          (historyEntry) => historyEntry.itemId !== parsedListing.itemId,
        );

        return [
          {
            itemId: parsedListing.itemId,
            url: parsedListing.normalizedUrl,
            searchedAt,
            listingTitle: resolvedListingTitle,
          },
          ...deduplicatedHistory,
        ].slice(0, MAX_HISTORY_ENTRIES);
      });
    };

    persistCurrentSearchToDatabase().catch((caughtError) => {
      console.error('Unexpected failure while persisting user listing history', {
        userId,
        listingId: parsedListing.itemId,
        error: caughtError,
      });
    });
  }, [listingTitle, parsedListing, userId]);

  return { searchHistory };
}
