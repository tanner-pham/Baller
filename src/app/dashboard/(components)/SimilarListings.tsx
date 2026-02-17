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
        <div className="border-5 border-black bg-white p-8 pb-20 rounded-xl shadow-[8px_8px_0px_0px_#000000] relative">

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
            <div className="bg-[#FF69B4] border-5 border-black px-6 py-3 rounded-md shadow-[4px_4px_0px_0px_#000000]">
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
