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
