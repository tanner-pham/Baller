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
        <div className="relative rounded-xl border-5 border-black bg-white p-8 pb-20 shadow-[8px_8px_0px_0px_#000000]">
          <h1 className="mb-4 pb-7 text-center text-6xl text-black font-['Anton',sans-serif] lg:text-7xl">
            SIMILAR LISTINGS
          </h1>

          <div className="mb-6 flex snap-x snap-mandatory gap-8 overflow-x-auto no-scrollbar">
            {listings.map((listing) => (
              <div
                key={`${listing.link}-${listing.title}`}
                className="w-[calc((100%_-_3*2rem)/4)] flex-shrink-0 snap-start"
              >
                <ListingCard {...listing} />
              </div>
            ))}
          </div>

          <div className="absolute bottom-6 right-7">
            <div className="rounded-xl border-5 border-black bg-[#FF69B4] px-6 py-3 shadow-[4px_4px_0px_0px_#000000] transition-all">
              <span className="text-center text-base uppercase text-black font-['Anton',sans-serif]">
                SWIPE →
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
