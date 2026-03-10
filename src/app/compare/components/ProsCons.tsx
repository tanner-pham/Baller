import { ThumbsUp, ThumbsDown } from 'lucide-react';
import type { ProConChip } from '../utils/prosConsEngine';
import {
  prosConsStyles,
} from '../../consts';

interface ProsConsProps {
  ruleBasedChips: ProConChip[];
  aiChips: ProConChip[];
  isAiLoading: boolean;
}

function Chip({ chip }: { chip: ProConChip }) {
  const isPro = chip.type === 'pro';

  return (
    <div
      className={`${prosConsStyles.chipBase} ${isPro ? prosConsStyles.chipProBg : prosConsStyles.chipConBg}`}
    >
      {isPro ? (
        <ThumbsUp className={prosConsStyles.icon} strokeWidth={3} />
      ) : (
        <ThumbsDown className={prosConsStyles.iconCon} strokeWidth={3} />
      )}
      <span className={`${prosConsStyles.labelBase} ${isPro ? '' : prosConsStyles.labelCon}`}>
        {chip.label}
      </span>
    </div>
  );
}

export function ProsCons({ ruleBasedChips, aiChips, isAiLoading }: ProsConsProps) {
  const hasChips = ruleBasedChips.length > 0 || aiChips.length > 0;
  const showShimmer = isAiLoading && aiChips.length === 0;

  if (!hasChips && !showShimmer) return null;

  return (
    <div className={prosConsStyles.wrap}>
      {ruleBasedChips.map((chip) => (
        <Chip key={`rule-${chip.label}`} chip={chip} />
      ))}
      {aiChips.map((chip) => (
        <Chip key={`ai-${chip.label}`} chip={chip} />
      ))}
      {showShimmer && (
        <>
          <div className={prosConsStyles.shimmerA} />
          <div className={prosConsStyles.shimmerB} />
        </>
      )}
    </div>
  );
}
