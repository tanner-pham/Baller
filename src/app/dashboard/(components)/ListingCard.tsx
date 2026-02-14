'use client';

import Link from 'next/link';

interface ListingCardProps {
  title: string;
  location: string;
  price: number;
  image: string;
  link: string;
}

export default function ListingCard({
  title,
  location,
  price,
  image,
  link,
}: ListingCardProps) {
  return (
    <div className="bg-[#FADF0B] p-6 border-5 border-black rounded-xl shadow-[6px_6px_0px_0px_#000000] transition-all flex flex-col items-center text-center cursor-pointer">

      {/* Price */}
      <div className="bg-[#90EE90] border-5 border-black px-6 py-3 mb-6 shadow-[4px_4px_0px_0px_#000000] rounded-md">
        <span className="font-['Anton',sans-serif] text-3xl text-black uppercase">
          ${price.toLocaleString()}
        </span>
      </div>

      {/* Image */}
      <div className="w-full h-44 bg-white border-5 border-black mb-6 overflow-hidden rounded-md">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Title */}
      <h2 className="font-['Anton',sans-serif] text-3xl mb-3 text-center text-black">
        {title}
      </h2>

      {/* Location */}
      <p className="font-['Space_Grotesk',sans-serif] font-semibold text-gray-700 text-center mb-6">
        {location}
      </p>

      {/* CTA */}
      <Link href={link}>
        <div className="bg-[#3300FF] text-white border-5 border-black px-6 py-3 shadow-[4px_4px_0px_0px_#000000] rounded-md hover:shadow-[8px_8px_0px_0px_#000000] hover:translate-x-[-2px] hover:translate-y-[-2px] active:shadow-none active:translate-x-[6px] active:translate-y-[6px] transition-all">
          <span className="font-['Anton',sans-serif] text-base uppercase text-center">
            VIEW LISTING
          </span>
        </div>
      </Link>

    </div>
    
  );
}
