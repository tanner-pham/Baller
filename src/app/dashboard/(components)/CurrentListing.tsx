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
    <div className="border-b-4 border-t-4 border-black bg-[#90EE90] p-15">
      <div className="mx-auto flex w-full max-w-6xl items-stretch justify-between gap-20 rounded-xl border-5 border-black bg-white p-6 shadow-[8px_8px_0px_0px_#000000]">
        <div className="flex-[1] overflow-hidden rounded-xl border-5 border-black">
          <img src={image} alt={title} className="h-full w-full object-cover" />
        </div>

        <div className="flex min-w-0 flex-[2] flex-col justify-between p-6">
          <div>
            <div className="mb-3 flex items-start justify-between gap-4">
              <h1
                className="line-clamp-2 break-words text-[clamp(2rem,6vw,6rem)] leading-[0.9] tracking-tight text-white font-['Bebas_Neue',sans-serif]"
                style={{
                  textShadow:
                    '6px 6px 0px #000000, -2px -2px 0px #000000, 2px -2px 0px #000000, -2px 2px 0px #000000',
                  WebkitTextStroke: '3px black',
                }}
              >
                {title}
              </h1>

              <div className="rounded-xl border-5 border-black bg-[#FF69B4] px-4 py-2 shadow-[4px_4px_0px_0px_#000000] transition-all">
                <span className="text-3xl text-black font-['Anton',sans-serif]">{price}</span>
              </div>
            </div>

            {description && (
              <p className="mb-4 text-center text-base font-semibold leading-relaxed text-gray-700 font-['Space_Grotesk',sans-serif]">
                {description}
              </p>
            )}

            <div className="mb-4 flex flex-wrap gap-3">
              <div className="flex items-center gap-2 rounded-xl border-5 border-black bg-[#FADF0B] px-3 py-2 shadow-[4px_4px_0px_0px_#000000] transition-all">
                <MapPin className="size-4" strokeWidth={3} />
                <span className="text-center font-semibold text-gray-700 font-['Space_Grotesk',sans-serif]">
                  {location}
                </span>
              </div>

              <div className="rounded-xl border-5 border-black bg-[#FF6600] px-3 py-2 shadow-[4px_4px_0px_0px_#000000] transition-all">
                <span className="text-center font-semibold text-white font-['Space_Grotesk',sans-serif]">
                  {postedTime}
                </span>
              </div>

              {conditionScore !== undefined && conditionLabel && (
                <div
                  className={`inline-flex items-center rounded-xl border-5 border-black px-3 py-2 shadow-[4px_4px_0px_0px_#000000] transition-all ${
                    conditionScore >= 0.8
                      ? 'bg-[#00FF00]'
                      : conditionScore >= 0.6
                        ? 'bg-[#FADF0B]'
                        : conditionScore >= 0.4
                          ? 'bg-[#FF6600]'
                          : 'bg-[#FF0000]'
                  }`}
                >
                  <span className="text-sm font-bold uppercase font-['Space_Grotesk',sans-serif]">
                    Condition: {conditionLabel}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="border-t-5 border-black pt-8">
            <div className="inline-flex items-center gap-2 rounded-xl border-5 border-black bg-[#3300FF] px-4 py-2 shadow-[4px_4px_0px_0px_#000000] transition-all">
              <User className="size-4 text-white" strokeWidth={3} />
              <span className="text-center font-semibold text-white font-['Space_Grotesk',sans-serif]">
                {sellerName}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
