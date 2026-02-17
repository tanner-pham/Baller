'use client';

import React from 'react';
import ListingCard from './ListingCard';

export interface SimilarListing {
  title: string;
  location: string;
  price: number;
  image: string;
  link: string;
}

export function SimilarListings({
  listings,
}: {
  listings: SimilarListing[];
}) {
  return (
    <section className="border-b-4 border-black bg-[#3300FF] p-15">
      <div className="mx-auto w-full max-w-6xl">
        {/* Title */}
        

        {/* Cards Frame */}
        <div className="relative rounded-xl border-5 border-black bg-white p-8 pb-20 shadow-[8px_8px_0px_0px_#000000]">

          <h1
            className="font-['Anton',sans-serif] text-6xl lg:text-7xl mb-4 text-black text-center pb-7"
          >
            SIMILAR LISTINGS
          </h1>
          
          {/* Cards Row */}
          <div className="flex gap-8 snap-x snap-mandatory overflow-x-auto no-scrollbar mb-6">
            {listings.map((listing, index) => (
              <div
                key={index}
                className="flex-shrink-0 w-[calc((100% - 3*2rem)/4)] snap-start"
              >
                <ListingCard {...listing} />
              </div>
            ))}
          </div>

          {/* Swipe Indicator */}
          <div className="absolute bottom-6 right-7">
            <div className="rounded-xl border-5 border-black bg-[#FF69B4] px-6 py-3 shadow-[4px_4px_0px_0px_#000000] transition-all hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[6px_6px_0px_0px_#000000]">
              <span className="font-['Anton',sans-serif] text-base uppercase text-center text-black">
                SWIPE →
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
