export interface NormalizedSimilarListing {
  title: string;
  price: number;
  location: string;
  image: string;
  link: string;
}

export interface NormalizedSimpleListing {
  title: string;
  price: string;
  location: string;
  image: string;
  link: string;
}

export interface NormalizedMarketplaceListing {
  title?: string;
  description?: string;
  price?: string;
  location?: string;
  images?: string[];
  sellerName?: string;
  listingDate?: string;
  condition?: string;
  simpleListings?: NormalizedSimpleListing[];
  similarListings?: NormalizedSimilarListing[];
}
