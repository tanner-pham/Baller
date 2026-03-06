'use client';

import Link from 'next/link';
import { X } from 'lucide-react';
import type { CompareSelection } from './SimilarListings';
import {
  anton,
  space,
  b5,
  shadow4,
  shadow6,
  roundedXl,
  pressable,
} from '../../consts';

interface CompareBarProps {
  selections: CompareSelection[];
  onRemove: (selection: CompareSelection) => void;
  onClear: () => void;
}

export function CompareBar({ selections, onRemove, onClear }: CompareBarProps) {
  if (selections.length === 0) return null;

  const isReady = selections.length === 2;
  const remainingCount = 2 - selections.length;

  const compareHref = isReady
    ? `/compare?left=${encodeURIComponent(selections[0].url)}&right=${encodeURIComponent(selections[1].url)}`
    : undefined;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t-5 border-black bg-white px-6 py-4 shadow-[0px_-6px_0px_0px_#000000]">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">

        {/* Left side: selection chips + helper text */}
        <div className="flex items-center gap-3">
          {selections.map((selection) => (
            <div
              key={selection.url}
              className={`flex items-center gap-2 bg-[#FADF0B] ${b5} ${roundedXl} px-3 py-2 ${shadow4}`}
            >
              <img
                src={selection.image}
                alt={selection.title}
                className="size-8 rounded border-2 border-black object-cover"
              />
              <span className={`${space} text-sm font-semibold line-clamp-1 max-w-[120px]`}>
                {selection.title}
              </span>
              <button
                type="button"
                onClick={() => onRemove(selection)}
                aria-label={`Remove ${selection.title}`}
                className="ml-1 rounded-full p-0.5 transition-colors hover:bg-black/10"
              >
                <X className="size-4" strokeWidth={3} />
              </button>
            </div>
          ))}

          {remainingCount > 0 && (
            <span className={`${space} text-sm font-semibold text-gray-500`}>
              Select {remainingCount} more listing{remainingCount > 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* Right side: Compare button */}
        {isReady && compareHref ? (
          <Link
            href={compareHref}
            className={`bg-[#FF69B4] ${b5} px-6 py-3 ${shadow6} ${roundedXl} ${pressable} text-black`}
          >
            <span className={`${anton} text-lg uppercase`}>COMPARE</span>
          </Link>
        ) : (
          <span
            className={`bg-gray-300 text-gray-500 cursor-not-allowed ${b5} px-6 py-3 ${roundedXl}`}
          >
            <span className={`${anton} text-lg uppercase`}>COMPARE</span>
          </span>
        )}

      </div>
    </div>
  );
}
