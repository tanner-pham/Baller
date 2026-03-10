'use client';
import { useState } from 'react';
import Link from 'next/link';
import { ExternalLink, BarChart3, Scale, Plus, Check } from 'lucide-react';
import { listingCardStyles } from '../../consts';

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
  const [hovered, setHovered] = useState<'baller' | 'compare' | null>(null);

  return (
    <div className={listingCardStyles.root}>

      {/* Price */}
      <div className={listingCardStyles.priceBox}>
        <span className={listingCardStyles.priceText}>
          ${price.toLocaleString()}
        </span>
      </div>

      {/* Image with Add to Compare overlay */}
      <div className={listingCardStyles.imageWrap}>
        {/* eslint-disable-next-line @next/next/no-img-element -- external Facebook CDN URLs */}
        <img
          src={image}
          alt={title}
          referrerPolicy="no-referrer"
          className={listingCardStyles.image}
        />
        {onToggleCompare && (
          <button
            type="button"
            onClick={() => onToggleCompare()}
            aria-label="Add to compare"
            className={`${listingCardStyles.compareOverlayButtonBase} ${
              isSelectedForCompare
                ? listingCardStyles.compareOverlaySelected
                : listingCardStyles.compareOverlayUnselected
            }`}
          >
            {isSelectedForCompare ? (
              <Check className={listingCardStyles.overlayIcon} strokeWidth={3} />
            ) : (
              <Plus className={listingCardStyles.overlayIcon} strokeWidth={3} />
            )}
          </button>
        )}
      </div>

      {/* Title */}
      <h2 className={listingCardStyles.title}>
        {title}
      </h2>

      {/* Location */}
      <p className={listingCardStyles.location}>
        {location}
      </p>

      {/* Baller Actions Row — flex back and forth on hover */}
      <div
        className={listingCardStyles.actionsRow}
        onMouseLeave={() => setHovered(null)}
      >
        {/* RUN IN BALLER - internal navigation */}
        {ballerUrl && (
          <div
            className={`${listingCardStyles.actionColWrap} ${
              hovered === null ? listingCardStyles.actionFlexDefault
                : hovered === 'baller' ? listingCardStyles.actionFlexExpanded
                  : listingCardStyles.actionFlexCollapsed
            }`}
            onMouseEnter={() => setHovered('baller')}
          >
            <Link
              href={ballerUrl}
              className={`${listingCardStyles.actionLinkBase} ${listingCardStyles.actionLinkBallerBg} ${
                hovered !== null && hovered !== 'baller' ? listingCardStyles.actionPadCollapsed : listingCardStyles.actionPadDefault
              }`}
            >
              <div className={`${listingCardStyles.actionInner} ${
                hovered !== null && hovered !== 'baller' ? listingCardStyles.actionInnerHidden : listingCardStyles.actionInnerVisible
              }`}>
                <span className={listingCardStyles.actionLabel}>
                  RUN IN BALLER
                </span>
                {hovered === 'baller' && (
                  <div className={listingCardStyles.actionSubRow}>
                    <BarChart3 className={listingCardStyles.actionSubIcon} />
                    <span className={listingCardStyles.actionSubText}>Full price analysis</span>
                  </div>
                )}
              </div>
            </Link>
          </div>
        )}

        {/* COMPARE - internal navigation */}
        {compareUrl && (
          <div
            className={`${listingCardStyles.actionColWrap} ${
              hovered === null ? listingCardStyles.actionFlexDefault
                : hovered === 'compare' ? listingCardStyles.actionFlexExpanded
                  : listingCardStyles.actionFlexCollapsed
            }`}
            onMouseEnter={() => setHovered('compare')}
          >
            <Link
              href={compareUrl}
              className={`${listingCardStyles.actionLinkBase} ${listingCardStyles.actionLinkCompareBg} ${
                hovered !== null && hovered !== 'compare' ? listingCardStyles.actionPadCollapsed : listingCardStyles.actionPadDefault
              }`}
            >
              <div className={`${listingCardStyles.actionInner} ${
                hovered !== null && hovered !== 'compare' ? listingCardStyles.actionInnerHidden : listingCardStyles.actionInnerVisible
              }`}>
                <span className={listingCardStyles.actionLabel}>
                  COMPARE
                </span>
                {hovered === 'compare' && (
                  <div className={listingCardStyles.actionSubRow}>
                    <Scale className={listingCardStyles.actionSubIcon} />
                    <span className={listingCardStyles.actionSubText}>Side-by-side</span>
                  </div>
                )}
              </div>
            </Link>
          </div>
        )}
      </div>

      {/* VIEW ON FACEBOOK - static full-width button at bottom */}
      <a
        href={link}
        target="_blank"
        rel="noopener noreferrer"
        className={listingCardStyles.facebookLink}
      >
        <span className={listingCardStyles.facebookText}>
          VIEW ON FACEBOOK
        </span>
        <ExternalLink className={listingCardStyles.facebookIcon} />
      </a>

    </div>
  );
}
