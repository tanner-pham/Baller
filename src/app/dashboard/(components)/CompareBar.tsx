'use client';

import Link from 'next/link';
import { X } from 'lucide-react';
import type { CompareSelection } from './SimilarListings';
import { compareBarStyles } from '../../consts';

interface CompareBarProps {
  selections: CompareSelection[];
  onRemove: (selection: CompareSelection) => void;
  onClear: () => void;
  limitMessage?: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- onClear reserved for clear-all button (not yet wired)
export function CompareBar({ selections, onRemove, onClear, limitMessage }: CompareBarProps) {
  if (selections.length === 0) return null;

  const isReady = selections.length === 2;
  const remainingCount = 2 - selections.length;

  const compareHref = isReady
    ? `/compare?left=${encodeURIComponent(selections[0].url)}&right=${encodeURIComponent(selections[1].url)}`
    : undefined;

  return (
    <div className={compareBarStyles.root}>
      {/* Limit reminder — floats above the bar */}
      {limitMessage && (
        <div className={compareBarStyles.limitRow}>
          <div className={compareBarStyles.limitBox}>
            <span className={compareBarStyles.limitText}>
              You can only compare 2 listings — remove one first!
            </span>
          </div>
        </div>
      )}
      <div className={compareBarStyles.barShell}>
      <div className={compareBarStyles.barInner}>

        {/* Left side: selection chips + helper text */}
        <div className={compareBarStyles.leftRow}>
          {selections.map((selection) => (
            <div
              key={selection.url}
              className={compareBarStyles.chip}
            >
              {/* eslint-disable @next/next/no-img-element -- external Facebook CDN URLs */}
              {selection.image ? (
                <img
                  src={selection.image}
                  alt={selection.title}
                  className={compareBarStyles.chipImage}
                />
              ) : (
                <div className={compareBarStyles.chipImageFallback}>
                  <span className={compareBarStyles.chipImageFallbackText}>?</span>
                </div>
              )}
              {/* eslint-enable @next/next/no-img-element */}
              <span className={compareBarStyles.chipTitle}>
                {selection.title}
              </span>
              <button
                type="button"
                onClick={() => onRemove(selection)}
                aria-label={`Remove ${selection.title}`}
                className={compareBarStyles.removeButton}
              >
                <X className={compareBarStyles.removeIcon} strokeWidth={3} />
              </button>
            </div>
          ))}

          {remainingCount > 0 && (
            <span className={compareBarStyles.remainingText}>
              Select {remainingCount} more listing{remainingCount > 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* Right side: Compare button */}
        {isReady && compareHref ? (
          <Link
            href={compareHref}
            className={compareBarStyles.compareLink}
          >
            <span className={compareBarStyles.compareLinkText}>COMPARE</span>
          </Link>
        ) : (
          <span
            className={compareBarStyles.compareDisabled}
          >
            <span className={compareBarStyles.compareLinkText}>COMPARE</span>
          </span>
        )}

      </div>
      </div>
    </div>
  );
}
