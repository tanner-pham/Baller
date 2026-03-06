'use client';

import ListingCard from './ListingCard';

export interface SimilarListing {
  title: string;
  location: string;
  price: number;
  image: string;
  link: string;
}

interface SimilarListingsProps {
  listings: SimilarListing[];
}

export function SimilarListings({ listings }: SimilarListingsProps) {
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
              return (
                <div
                  key={`${listing.link}-${listing.title}`}
                  className="w-[calc((100%_-_2*1.5rem)/3)] flex-shrink-0 snap-start flex"
                >
                  <ListingCard {...listing} ballerUrl={ballerUrl} />
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
