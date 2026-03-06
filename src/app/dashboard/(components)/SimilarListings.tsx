'use client';

import ListingCard from './ListingCard';

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
    <section className="border-b-4 border-black bg-[#3300FF] p-15">
      <div className="mx-auto w-full max-w-6xl">
        <div className="relative rounded-xl border-5 border-black bg-white p-8 shadow-[8px_8px_0px_0px_#000000]">
          <h1 className="mb-4 pb-7 text-center text-6xl text-black font-['Anton',sans-serif] lg:text-7xl">
            SIMILAR LISTINGS
          </h1>

          <div className="mb-6 flex snap-x snap-mandatory gap-6 overflow-x-auto no-scrollbar items-stretch">
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
                  className="w-[calc((100%_-_2*1.5rem)/3)] flex-shrink-0 snap-start flex"
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

          <p className="text-center text-sm text-gray-400 font-['Anton',sans-serif] uppercase tracking-widest">
            Swipe for more &rarr;
          </p>
        </div>
      </div>
    </section>
  );
}
