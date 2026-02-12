"use client";

import { MapPin, User } from 'lucide-react';

interface CurrentListingProps {
  image: string;
  price: string;
  title: string;
  description?: string;
  postedTime: string;
  location: string;
  sellerName: string;
  conditionScore?: number;
  conditionLabel?: string;
}

export function CurrentListing({
  image,
  price,
  title,
  description,
  postedTime,
  location,
  sellerName,
  conditionScore,
  conditionLabel,
}: CurrentListingProps) {
  return (
    <div className="w-full max-w-2xl">
      {/* Main Card - Horizontal Layout */}
      <div className="bg-white border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex">
        {/* Image Container */}
        <div className="relative flex-shrink-0 w-48 border-r-4 border-black">
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Content Section */}
        <div className="flex-1 p-4 flex flex-col justify-between">
          <div>
            {/* Price & Title Row */}
            <div className="flex items-start justify-between gap-3 mb-2">
              <h2 className="font-black text-base leading-tight flex-1">
                {title}
              </h2>
              <div className="bg-[#FF69B4] border-3 border-black px-3 py-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex-shrink-0">
                <span className="font-black text-lg">{price}</span>
              </div>
            </div>

            {/* Description */}
            {description && (
              <p className="text-sm text-gray-700 mb-3 leading-relaxed">
                {description}
              </p>
            )}

            {/* Location & Time */}
            <div className="flex flex-wrap gap-2 mb-3">
              <div className="bg-[#FADF0B] border-2 border-black px-2 py-1 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" strokeWidth={3} />
                <span className="font-bold text-xs">{location}</span>
              </div>
              <div className="bg-[#FF6600] border-2 border-black px-2 py-1">
                <span className="font-bold text-xs text-white">{postedTime}</span>
              </div>
              {conditionScore !== undefined && conditionLabel && (
                <div className={`border-2 border-black px-2 py-1 ${
                  conditionScore >= 0.8 ? 'bg-[#00FF00]' :
                  conditionScore >= 0.6 ? 'bg-[#FADF0B]' :
                  conditionScore >= 0.4 ? 'bg-[#FF6600]' :
                  'bg-[#FF0000]'
                }`}>
                  <span className="font-bold text-xs">
                    Condition: {conditionLabel}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Seller Info */}
          <div className="border-t-3 border-black pt-2">
            <div className="flex items-center gap-3">
              <div className="bg-[#3300FF] border-2 border-black px-3 py-1 inline-flex items-center gap-1.5 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                <User className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                <span className="font-bold text-xs text-white">{sellerName}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}