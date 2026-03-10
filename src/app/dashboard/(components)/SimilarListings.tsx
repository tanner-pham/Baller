'use client';

import ListingCard from './ListingCard';
import { similarListingsStyles } from '../../consts';

export interface SimilarListing {
  title: string;
  location: string;
  price: number;
  image: string;
  link: string;
}

export interface CompareSelection {
  url: string;
  title: string;
  price: string;
  image: string;
}

interface SimilarListingsProps {
  listings: SimilarListing[];
  currentListingUrl?: string;
  onToggleCompare?: (selection: CompareSelection) => void;
  compareSelections?: CompareSelection[];
}

export function SimilarListings({
  listings,
  currentListingUrl,
  onToggleCompare,
  compareSelections,
}: SimilarListingsProps) {
  return (
    <section className={similarListingsStyles.section}>
      <div className={similarListingsStyles.container}>
        <div className={similarListingsStyles.frame}>
          <h1 className={similarListingsStyles.title}>
            SIMILAR LISTINGS
          </h1>

          <div className={similarListingsStyles.row}>
            {listings.map((listing) => {
              const ballerUrl = `/dashboard?listingUrl=${encodeURIComponent(listing.link)}`;
              const compareUrl = currentListingUrl
                ? `/compare?left=${encodeURIComponent(currentListingUrl)}&right=${encodeURIComponent(listing.link)}`
                : undefined;
              const isSelected = compareSelections?.some(s => s.url === listing.link) ?? false;

              const handleToggle = onToggleCompare
                ? () => onToggleCompare({
                    url: listing.link,
                    title: listing.title,
                    price: `$${listing.price.toLocaleString()}`,
                    image: listing.image,
                  })
                : undefined;

              return (
                <div
                  key={`${listing.link}-${listing.title}`}
                  className={similarListingsStyles.itemWrap}
                >
                  <ListingCard
                    {...listing}
                    ballerUrl={ballerUrl}
                    compareUrl={compareUrl}
                    onToggleCompare={handleToggle}
                    isSelectedForCompare={isSelected}
                  />
                </div>
              );
            })}
          </div>

          <p className={similarListingsStyles.swipeHint}>
            Swipe for more &rarr;
          </p>
        </div>
      </div>
    </section>
  );
}
