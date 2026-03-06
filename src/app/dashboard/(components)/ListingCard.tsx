'use client';
import Link from 'next/link';
import { ExternalLink, BarChart3 } from 'lucide-react';
import {
  anton,
  space,
  b5,
  shadow4,
  roundedXl,
  pressable,
} from '../../consts';

interface ListingCardProps {
  title: string;
  location: string;
  price: number;
  image: string;
  link: string;
  ballerUrl?: string;
}

export default function ListingCard({
  title,
  location,
  price,
  image,
  link,
  ballerUrl,
}: ListingCardProps) {
  return (
    <div className="flex flex-col items-center rounded-xl border-5 border-black bg-[#FADF0B] p-6 text-center shadow-[6px_6px_0px_0px_#000000] transition-all">

      {/* Price */}
      <div className="mb-6 rounded-xl border-5 border-black bg-[#90EE90] px-6 py-3 shadow-[4px_4px_0px_0px_#000000] transition-all">
        <span className={`${anton} text-3xl text-black uppercase`}>
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
      <h2 className={`${anton} text-3xl mb-3 text-center text-black`}>
        {title}
      </h2>

      {/* Location */}
      <p className={`${space} font-semibold text-gray-700 text-center mb-6`}>
        {location}
      </p>

      {/* Button Row */}
      <div className="flex gap-3 w-full">

        {/* VIEW LISTING - external link */}
        <div className="group flex-1">
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className={`block bg-[#3300FF] text-white ${b5} px-4 py-3 ${shadow4} ${roundedXl} ${pressable} overflow-hidden`}
          >
            <span className={`${anton} text-base uppercase text-center block`}>
              VIEW LISTING
            </span>
            <div className="max-h-0 overflow-hidden transition-all duration-200 group-hover:max-h-10 group-hover:mt-1">
              <div className="flex items-center justify-center gap-1">
                <ExternalLink className="size-3" />
                <span className={`${space} text-xs font-semibold`}>View on Facebook</span>
              </div>
            </div>
          </a>
        </div>

        {/* RUN IN BALLER - internal navigation */}
        {ballerUrl && (
          <div className="group flex-1">
            <Link
              href={ballerUrl}
              className={`block bg-[#FF6600] text-white ${b5} px-4 py-3 ${shadow4} ${roundedXl} ${pressable} overflow-hidden`}
            >
              <span className={`${anton} text-base uppercase text-center block`}>
                RUN IN BALLER
              </span>
              <div className="max-h-0 overflow-hidden transition-all duration-200 group-hover:max-h-10 group-hover:mt-1">
                <div className="flex items-center justify-center gap-1">
                  <BarChart3 className="size-3" />
                  <span className={`${space} text-xs font-semibold`}>Full price analysis</span>
                </div>
              </div>
            </Link>
          </div>
        )}

      </div>

    </div>
  );
}
