export interface RapidApiListingTextField {
  text?: string;
}

export interface RapidApiListingPriceField {
  amount_with_offset?: string;
  currency?: string;
  amount?: string;
}

export interface RapidApiVehicleOdometerData {
  unit?: string;
  value?: number;
}

export interface RapidApiCrossPostListing {
  id?: string | number;
  is_on_marketplace?: boolean;
}

export interface RapidApiCrossPostInfo {
  all_listings?: RapidApiCrossPostListing[];
}

export interface RapidApiMarketplaceListing {
  __typename?: string;
  marketplace_listing_title?: string;
  custom_title?: string;
  id?: string;
  redacted_description?: RapidApiListingTextField | null;
  creation_time?: number;
  location_text?: RapidApiListingTextField | null;
  formatted_price?: RapidApiListingTextField | null;
  listing_price?: RapidApiListingPriceField | null;
  marketplace_listing_seller?: { id?: string; name?: string } | null;
  share_uri?: string;
  images?: string[];
  cross_post_info?: RapidApiCrossPostInfo | null;
  vehicle_make_display_name?: string | null;
  vehicle_model_display_name?: string | null;
  vehicle_exterior_color?: string | null;
  vehicle_interior_color?: string | null;
  vehicle_odometer_data?: RapidApiVehicleOdometerData | null;
  [key: string]: unknown;
}

export interface RapidApiMarketplaceWrapper {
  data?: RapidApiMarketplaceListing;
  result?: RapidApiMarketplaceListing;
  product?: RapidApiMarketplaceListing;
  listing?: RapidApiMarketplaceListing;
  [key: string]: unknown;
}
