"use client";
import { Clock3, MapPin } from 'lucide-react';
import {
  conditionBgExcellent,
  conditionBgFair,
  conditionBgGood,
  conditionBgPoor,
  currentListingStyles,
  textShadowStyle,
} from '../../consts';

export interface CurrentListingProps {
  image: string;
  price: string;
  title: string;
  description?: string;
  listingDate: string;
  location: string;
  conditionScore?: number;
  conditionLabel?: string;
  compareButton?: React.ReactNode;
  backToListingButton?: React.ReactNode;
}

export function CurrentListing({
  image,
  price,
  title,
  description,
  listingDate,
  location,
  conditionScore,
  conditionLabel,
  compareButton,
  backToListingButton,
}: CurrentListingProps) {
  const conditionBg =
    conditionScore === undefined
      ? null
      : conditionScore >= 0.8
        ? conditionBgExcellent
        : conditionScore >= 0.6
          ? conditionBgGood
          : conditionScore >= 0.4
            ? conditionBgFair
            : conditionBgPoor;

  return (
    <div className={currentListingStyles.section}>
      <div className={currentListingStyles.card}>
        <div className={currentListingStyles.imageWrap}>
          {/* eslint-disable-next-line @next/next/no-img-element -- external Facebook CDN URLs */}
          <img
            src={image}
            alt={title}
            width={500}
            height={500}
            referrerPolicy="no-referrer"
            className={currentListingStyles.image}
          />
        </div>

        <div className={currentListingStyles.content}>
          <div>
            <div className={currentListingStyles.titlePriceRow}>
              <h1
                className={currentListingStyles.title}
                style={textShadowStyle}
              >
                {title}
              </h1>

              <div className={currentListingStyles.priceBox}>
                <span className={currentListingStyles.priceText}>{price}</span>
              </div>
            </div>

            {description && (
              <p className={currentListingStyles.description}>
                {description}
              </p>
            )}

            <div className={currentListingStyles.metaRow}>
              <div className={currentListingStyles.locationChip}>
                <MapPin className={currentListingStyles.locationIcon} strokeWidth={3} />
                <span className={currentListingStyles.locationText}>
                  {location}
                </span>
              </div>

              <div className={currentListingStyles.timeChip}>
                <Clock3 className={currentListingStyles.timeIcon} strokeWidth={3} />
                <span className={currentListingStyles.timeText}>
                  {listingDate}
                </span>
              </div>

              {conditionBg && conditionLabel && (
                <div
                  className={`${currentListingStyles.conditionChipBase} ${conditionBg}`}
                >
                  <span className={currentListingStyles.conditionText}>
                    Condition: {conditionLabel}
                  </span>
                </div>
              )}
            </div>

            {(backToListingButton || compareButton) && (
              <div className={currentListingStyles.actionsRow}>
                {backToListingButton}
                {compareButton}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
