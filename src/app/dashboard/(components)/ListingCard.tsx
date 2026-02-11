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
    <Link href={link}>
      <div className="bg-yellow-300 p-4 border-4 border-black shadow-[6px_6px_0px_black] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[8px_8px_0px_black] transition-all flex flex-col items-center text-center cursor-pointer">

        {/* Price */}
        <div className="bg-green-400 border-4 border-black px-6 py-2 mb-4 font-bold text-lg shadow-[4px_4px_0px_black]">
          ${price.toLocaleString()}
        </div>

        {/* Image */}
        <div className="w-full h-40 bg-white border-4 border-black mb-4 overflow-hidden">
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Title */}
        <h3 className="font-bold text-lg">
          {title}
        </h3>

        {/* Location */}
        <p className="text-sm mb-4">
          {location}
        </p>

        {/* CTA */}
        <div className="bg-green-500 border-4 border-black px-6 py-2 font-bold shadow-[4px_4px_0px_black]">
          LISTING HERE
        </div>

      </div>
    </Link>
  );
}
