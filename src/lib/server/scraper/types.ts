export interface ScrapedListingDetails {
  id: string;
  url: string;
  title: string;
  price: string;
  description: string;
  location: string;
  condition: string;
  sellerName: string;
  listingDate: string;
  imageUrls: string[];
}

export interface ScrapedComparable {
  title: string;
  price: string;
  imageUrl: string;
  url: string;
  location: string;
}

export interface ScrapeResult {
  listing: ScrapedListingDetails;
  searchTerm: string;
  comparables: ScrapedComparable[];
}
