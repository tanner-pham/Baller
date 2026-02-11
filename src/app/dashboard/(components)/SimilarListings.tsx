'use client';

import React from 'react';
import ListingCard from './ListingCard';

interface ListingCardType {
  title: string;
  location: string;
  price: number;
  image: string;
  link: string;
}

export function SimilarListings({
  listings,
}: {
  listings: ListingCardType[];
}) {
  return (
    <section className="bg-yellow-400 border-4 border-black px-8 pt-8 pb-20 relative">

      {/* Title */}
      <h2 className="font-['Anton',sans-serif] text-3xl mb-8">
        Similar Listings
      </h2>

      {/* Cards Row */}
      <div className="overflow-x-auto no-scrollbar">
        <div className="flex gap-6 snap-x snap-mandatory">
          {listings.map((listing, index) => (
            <div
              key={index}
              className="min-w-[20%] snap-start flex-shrink-0"
            >
              <ListingCard {...listing} />
            </div>
          ))}
        </div>
      </div>

      {/* Swipe Indicator (INSIDE BORDER) */}
      <div className="absolute right-8 bottom-6">
        <div className="bg-pink-400 border-4 border-black px-5 py-2 font-['Anton'] shadow-[4px_4px_0px_black]">
          SWIPE →
        </div>
      </div>

    </section>
  );
}
