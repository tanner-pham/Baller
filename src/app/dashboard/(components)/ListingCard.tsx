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
    <div className="flex cursor-pointer flex-col items-center rounded-xl border-5 border-black bg-[#FADF0B] p-6 text-center shadow-[6px_6px_0px_0px_#000000] transition-all">

      {/* Price */}
      <div className="mb-6 rounded-xl border-5 border-black bg-[#90EE90] px-6 py-3 shadow-[4px_4px_0px_0px_#000000] transition-all">
        <span className="font-['Anton',sans-serif] text-3xl text-black uppercase">
          ${price.toLocaleString()}
        </span>
      </div>

      {/* Image */}
      <div className="mb-6 h-44 w-full overflow-hidden rounded-xl border-5 border-black bg-white">
        <img
          src={image}
          alt={title}
          referrerPolicy="no-referrer"
          className="h-full w-full object-cover"
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
        <div className="rounded-xl border-5 border-black bg-[#3300FF] px-6 py-3 text-white shadow-[4px_4px_0px_0px_#000000] transition-all hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[6px_6px_0px_0px_#000000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none">
          <span className="font-['Anton',sans-serif] text-base uppercase text-center">
            VIEW LISTING
          </span>
        </div>
      </Link>

    </div>
    
  );
}
