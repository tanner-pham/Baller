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
    <section className="bg-[#3300FF] border-4 border-black px-10 pt-10 pb-24 relative">

      {/* Title */}
      <h2
        className="font-['Bebas_Neue',sans-serif] text-5xl sm:text-6xl lg:text-7xl text-white leading-[1] tracking-tight text-center mb-8"
        style={{ 
          textShadow: '6px 6px 0px #000000, -2px -2px 0px #000000, 2px -2px 0px #000000, -2px 2px 0px #000000',
          WebkitTextStroke: '3px black'
        }}
      >
        Similar Listings
      </h2>

      {/* Cards Frame */}
      <div className="border-4 border-black bg-white p-6 relative">
        {/* Cards Row */}
        <div className="flex gap-6 snap-x snap-mandatory overflow-x-auto no-scrollbar mb-4">
          {listings.map((listing, index) => (
            <div
              key={index}
              className="flex-shrink-0 w-[calc((100% - 3*1.5rem)/4)] snap-start"
            >
              <ListingCard {...listing} />
            </div>
          ))}
        </div>

        {/* Swipe Indicator INSIDE WHITE FRAME */}
        <div className="absolute bottom-4 right-4">
          <div className="bg-pink-400 border-4 border-black px-5 py-2 font-['Anton'] shadow-[4px_4px_0px_black]">
            SWIPE →
          </div>
        </div>
      </div>

    </section>
  );
}
