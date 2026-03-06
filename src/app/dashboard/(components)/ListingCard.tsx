'use client';
import { useState } from 'react';
import Link from 'next/link';
import { ExternalLink, BarChart3, Scale, Plus, Check } from 'lucide-react';
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
  compareUrl?: string;
  onToggleCompare?: () => void;
  isSelectedForCompare?: boolean;
}

export default function ListingCard({
  title,
  location,
  price,
  image,
  link,
  ballerUrl,
  compareUrl,
  onToggleCompare,
  isSelectedForCompare,
}: ListingCardProps) {
  const [hovered, setHovered] = useState<'view' | 'baller' | 'compare' | null>(null);

  return (
    <div className="flex h-full flex-col items-center rounded-xl border-5 border-black bg-[#FADF0B] p-6 text-center shadow-[6px_6px_0px_0px_#000000] transition-all">

      {/* Price */}
      <div className="mb-6 rounded-xl border-5 border-black bg-[#90EE90] px-6 py-3 shadow-[4px_4px_0px_0px_#000000] transition-all">
        <span className={`${anton} text-3xl text-black uppercase`}>
          ${price.toLocaleString()}
        </span>
      </div>

      {/* Image with Add to Compare overlay */}
      <div className="relative mb-6 h-44 w-full overflow-hidden rounded-xl border-5 border-black bg-white">
        <img
          src={image}
          alt={title}
          referrerPolicy="no-referrer"
          className="h-full w-full object-cover"
        />
        {onToggleCompare && (
          <button
            type="button"
            onClick={() => onToggleCompare()}
            aria-label="Add to compare"
            className={`absolute top-2 right-2 flex size-8 items-center justify-center rounded-full ${b5} shadow-[2px_2px_0px_0px_#000000] transition-all ${
              isSelectedForCompare
                ? 'bg-[#FF69B4] text-white'
                : 'bg-white text-black'
            }`}
          >
            {isSelectedForCompare ? (
              <Check className="size-4" strokeWidth={3} />
            ) : (
              <Plus className="size-4" strokeWidth={3} />
            )}
          </button>
        )}
      </div>

      {/* Title */}
      <h2 className={`${anton} text-3xl mb-3 text-center text-black`}>
        {title}
      </h2>

      {/* Location */}
      <p className={`${space} font-semibold text-gray-700 text-center`}>
        {location}
      </p>

      {/* Button Row */}
      <div
        className="mt-auto flex gap-2 w-full pt-6"
        onMouseLeave={() => setHovered(null)}
      >

        {/* VIEW LISTING - external link */}
        <div
          className={`min-w-0 transition-all duration-300 ease-in-out ${
            hovered === null ? 'flex-1' :
            hovered === 'view' ? 'flex-[3]' : 'flex-[0_0_2.5rem]'
          }`}
          onMouseEnter={() => setHovered('view')}
        >
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center justify-center h-full bg-[#3300FF] text-white ${b5} py-3 ${shadow4} ${roundedXl} ${pressable} overflow-hidden transition-all duration-300 ${
              hovered !== null && hovered !== 'view' ? 'px-0' : 'px-4'
            }`}
          >
            <div className={`transition-opacity duration-200 overflow-hidden ${
              hovered !== null && hovered !== 'view' ? 'opacity-0 w-0' : 'opacity-100'
            }`}>
              <span className={`${anton} text-base uppercase text-center block whitespace-nowrap`}>
                VIEW LISTING
              </span>
              {hovered === 'view' && (
                <div className="flex items-center justify-center gap-1 mt-1">
                  <ExternalLink className="size-3" />
                  <span className={`${space} text-xs font-semibold whitespace-nowrap`}>View on Facebook</span>
                </div>
              )}
            </div>
          </a>
        </div>

        {/* RUN IN BALLER - internal navigation */}
        {ballerUrl && (
          <div
            className={`min-w-0 transition-all duration-300 ease-in-out ${
              hovered === null ? 'flex-1' :
              hovered === 'baller' ? 'flex-[3]' : 'flex-[0_0_2.5rem]'
            }`}
            onMouseEnter={() => setHovered('baller')}
          >
            <Link
              href={ballerUrl}
              className={`flex items-center justify-center h-full bg-[#FF6600] text-white ${b5} py-3 ${shadow4} ${roundedXl} ${pressable} overflow-hidden transition-all duration-300 ${
                hovered !== null && hovered !== 'baller' ? 'px-0' : 'px-4'
              }`}
            >
              <div className={`transition-opacity duration-200 overflow-hidden ${
                hovered !== null && hovered !== 'baller' ? 'opacity-0 w-0' : 'opacity-100'
              }`}>
                <span className={`${anton} text-base uppercase text-center block whitespace-nowrap`}>
                  RUN IN BALLER
                </span>
                {hovered === 'baller' && (
                  <div className="flex items-center justify-center gap-1 mt-1">
                    <BarChart3 className="size-3" />
                    <span className={`${space} text-xs font-semibold whitespace-nowrap`}>Full price analysis</span>
                  </div>
                )}
              </div>
            </Link>
          </div>
        )}

        {/* COMPARE - internal navigation */}
        {compareUrl && (
          <div
            className={`min-w-0 transition-all duration-300 ease-in-out ${
              hovered === null ? 'flex-1' :
              hovered === 'compare' ? 'flex-[3]' : 'flex-[0_0_2.5rem]'
            }`}
            onMouseEnter={() => setHovered('compare')}
          >
            <Link
              href={compareUrl}
              className={`flex items-center justify-center h-full bg-[#FF69B4] text-white ${b5} py-3 ${shadow4} ${roundedXl} ${pressable} overflow-hidden transition-all duration-300 ${
                hovered !== null && hovered !== 'compare' ? 'px-0' : 'px-4'
              }`}
            >
              <div className={`transition-opacity duration-200 overflow-hidden ${
                hovered !== null && hovered !== 'compare' ? 'opacity-0 w-0' : 'opacity-100'
              }`}>
                <span className={`${anton} text-base uppercase text-center block whitespace-nowrap`}>
                  COMPARE
                </span>
                {hovered === 'compare' && (
                  <div className="flex items-center justify-center gap-1 mt-1">
                    <Scale className="size-3" />
                    <span className={`${space} text-xs font-semibold whitespace-nowrap`}>Side-by-side</span>
                  </div>
                )}
              </div>
            </Link>
          </div>
        )}

      </div>

    </div>
  );
}
