import { ArrowUp, ArrowDown } from 'lucide-react';
import { computePriceDiff } from '../utils/diffUtils';
import { priceComparisonStyles } from '../../consts';

interface PriceComparisonProps {
  leftPrice: string | undefined;
  rightPrice: string | undefined;
}

export function PriceComparison({ leftPrice, rightPrice }: PriceComparisonProps) {
  const diff = computePriceDiff(leftPrice, rightPrice);

  // Don't render if we can't compare
  if (diff.leftPrice === null || diff.rightPrice === null) return null;

  const leftIsCheaper = diff.cheaperSide === 'left';
  const rightIsCheaper = diff.cheaperSide === 'right';
  const isEqual = diff.cheaperSide === 'equal';

  return (
    <div className={priceComparisonStyles.root} data-testid="price-comparison">
      {/* Left Price */}
      <div className={priceComparisonStyles.side}>
        {!isEqual && (
          leftIsCheaper
            ? <ArrowDown className={priceComparisonStyles.arrowGreen} strokeWidth={3} />
            : <ArrowUp className={priceComparisonStyles.arrowRed} strokeWidth={3} />
        )}
        <span className={priceComparisonStyles.priceText}>{leftPrice}</span>
      </div>

      {/* Difference Badge */}
      <div className={priceComparisonStyles.diffBadge}>
        <span className={priceComparisonStyles.diffText}>
          {isEqual ? 'Same price' : `$${diff.difference!.toLocaleString()} difference`}
        </span>
      </div>

      {/* Right Price */}
      <div className={priceComparisonStyles.side}>
        {!isEqual && (
          rightIsCheaper
            ? <ArrowDown className={priceComparisonStyles.arrowGreen} strokeWidth={3} />
            : <ArrowUp className={priceComparisonStyles.arrowRed} strokeWidth={3} />
        )}
        <span className={priceComparisonStyles.priceText}>{rightPrice}</span>
      </div>
    </div>
  );
}
