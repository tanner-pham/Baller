import type { SimilarListing } from './(components)/SimilarListings';

export interface SearchHistoryEntry {
  itemId: string;
  url: string;
  searchedAt: string;
  listingTitle: string;
}

export interface MarketplaceListingApiData {
  /**
   * Client-side identity of the listing request that produced this payload.
   * Not part of the external `/api/marketplace-listing` JSON contract.
   */
  itemId?: string;
  title?: string;
  description?: string;
  price?: string;
  location?: string;
  image?: string;
  sellerName?: string;
  postedTime?: string;
  similarListings?: SimilarListing[];
}

export interface MarketplaceListingApiResponse {
  success: boolean;
  listing?: MarketplaceListingApiData;
  error?: string;
}

export type SimilarListingsStatus = 'pending' | 'ready' | 'stale' | 'error';

export interface SimilarListingsApiResponse {
  success: boolean;
  status: SimilarListingsStatus;
  retryAfterMs?: number;
  warning?: string;
  similarListings?: SimilarListing[];
  error?: string;
}

export interface ConditionAssessmentData {
  conditionScore?: number;
  conditionLabel?: string;
  modelAccuracy?: string;
  topReasons?: string[];
  suggestedPrice?: string;
  suggestedOffer?: string;
  negotiationTip?: string;
}

export interface ConditionAssessmentApiResponse {
  success: boolean;
  assessment?: ConditionAssessmentData;
  error?: string;
}
