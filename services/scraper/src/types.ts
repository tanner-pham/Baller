export interface NormalizedSimilarListing {
  title: string;
  price: number;
  location: string;
  image: string;
  link: string;
}

export interface NormalizedMarketplaceListing {
  title?: string;
  description?: string;
  price?: string;
  location?: string;
  image?: string;
  sellerName?: string;
  postedTime?: string;
  similarListings?: NormalizedSimilarListing[];
}

export interface SimilarJobPayload {
  listingId: string;
  listingUrl: string;
  queryHash: string;
  queryText: string;
  keywords: string[];
  location: string | null;
  minPrice: number | null;
  maxPrice: number | null;
}
