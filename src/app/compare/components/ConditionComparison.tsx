import { computeConditionDiff } from '../utils/diffUtils';
import {
  conditionBgExcellent,
  conditionBgFair,
  conditionBgGood,
  conditionBgPoor,
  conditionComparisonStyles,
} from '../../consts';

interface ConditionComparisonProps {
  leftScore?: number;
  leftLabel?: string;
  rightScore?: number;
  rightLabel?: string;
}

function getConditionColor(score: number): string {
  if (score >= 0.8) return conditionBgExcellent;
  if (score >= 0.6) return conditionBgGood;
  if (score >= 0.4) return conditionBgFair;
  return conditionBgPoor;
}

export function ConditionComparison({
  leftScore,
  leftLabel,
  rightScore,
  rightLabel,
}: ConditionComparisonProps) {
  const diff = computeConditionDiff(leftScore, leftLabel, rightScore, rightLabel);

  // If neither side has a score, don't render
  if (diff.leftScore === null && diff.rightScore === null) return null;

  return (
    <div className={conditionComparisonStyles.root} data-testid="condition-comparison">
      {/* Left Condition */}
      <div>
        {diff.leftScore !== null && diff.leftLabel !== null ? (
          <>
            <div className={conditionComparisonStyles.headerRow}>
              <span className={conditionComparisonStyles.label}>{diff.leftLabel}</span>
              <span className={conditionComparisonStyles.pct}>{Math.round(diff.leftScore * 100)}%</span>
            </div>
            <div className={conditionComparisonStyles.bar}>
              <div
                className={`${conditionComparisonStyles.fillBase} ${getConditionColor(diff.leftScore)}`}
                style={{ width: `${Math.round(diff.leftScore * 100)}%` }}
              />
            </div>
          </>
        ) : (
          <span className={conditionComparisonStyles.na}>N/A</span>
        )}
      </div>

      {/* Right Condition */}
      <div>
        {diff.rightScore !== null && diff.rightLabel !== null ? (
          <>
            <div className={conditionComparisonStyles.headerRow}>
              <span className={conditionComparisonStyles.label}>{diff.rightLabel}</span>
              <span className={conditionComparisonStyles.pct}>{Math.round(diff.rightScore * 100)}%</span>
            </div>
            <div className={conditionComparisonStyles.bar}>
              <div
                className={`${conditionComparisonStyles.fillBase} ${getConditionColor(diff.rightScore)}`}
                style={{ width: `${Math.round(diff.rightScore * 100)}%` }}
              />
            </div>
          </>
        ) : (
          <span className={conditionComparisonStyles.na}>N/A</span>
        )}
      </div>
    </div>
  );
}
