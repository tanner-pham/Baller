"use client";

import { MapPin, User } from 'lucide-react';

export interface CurrentListingProps {
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
    <div className="border-b-4 border-black bg-[#90EE90] p-15">
      {/* Main Card */}
      <div className="mx-auto flex w-full max-w-6xl h-[500px] items-stretch justify-between gap-20">
        
        {/* Image */}
        <div className="flex-[1] border-5 border-black overflow-hidden rounded-xl">
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Content */}
        <div className="flex-[2] p-6 flex flex-col justify-between min-w-0">
          <div>
            {/* Title + Price */}
            <div className="flex items-start justify-between gap-4 mb-3">
              {/* <h1 className="font-['Bebas_Neue',sans-serif] text-2xl sm:text-8xl lg:text-9xl text-white leading-[0.9] tracking-tight" */}
                  <h1 className="font-['Bebas_Neue',sans-serif]
                    text-[clamp(2rem,6vw,6rem)]
                    leading-[0.9]
                    tracking-tight
                    line-clamp-2
                    break-words
                    text-white"
                  style={{ 
                    textShadow: '6px 6px 0px #000000, -2px -2px 0px #000000, 2px -2px 0px #000000, -2px 2px 0px #000000',
                    WebkitTextStroke: '3px black'
                  }}>
                {title}
              </h1>

              <div className="bg-[#FF69B4] border-5 border-black px-4 py-2 shadow-[4px_4px_0px_0px_#000000] rounded-md">
                <span className="font-['Anton',sans-serif] text-3xl text-black">
                  {price}
                </span>
              </div>
            </div>

            {/* Description */}
            {description && (
              <p className="font-['Space_Grotesk',sans-serif] font-semibold text-gray-700 text-center mb-4 text-base leading-relaxed">
                {description}
              </p>
            )}

            {/* Location & Time */}
            <div className="flex flex-wrap gap-3 mb-4">
              <div className="bg-[#FADF0B] border-5 border-black px-3 py-2 flex items-center gap-2 rounded-md">
                <MapPin className="size-4" strokeWidth={3} />
                <span className="font-['Space_Grotesk',sans-serif] font-semibold text-gray-700 text-center">
                  {location}
                </span>
              </div>

              <div className="bg-[#FF6600] border-5 border-black px-3 py-2 rounded-md">
                <span className="font-['Space_Grotesk',sans-serif] font-semibold text-white text-center">
                  {postedTime}
                </span>
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

          {/* Seller */}
          <div className="border-t-5 border-black pt-8">
            <div className="inline-flex items-center gap-2 bg-[#3300FF] border-5 border-black px-4 py-2 shadow-[4px_4px_0px_0px_#000000] rounded-md">
              <User className="size-4 text-white" strokeWidth={3} />
              <span className="font-['Space_Grotesk',sans-serif] font-semibold text-white text-center">
                {sellerName}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
