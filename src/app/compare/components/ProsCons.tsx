import { ThumbsUp, ThumbsDown } from 'lucide-react';
import type { ProConChip } from '../utils/prosConsEngine';
import {
  space,
  b5,
  roundedXl,
  shadow4,
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
      className={`${isPro ? 'bg-[#90EE90]' : 'bg-[#FF6600]'} ${b5} ${roundedXl} ${shadow4} px-3 py-1.5 inline-flex items-center gap-1.5`}
    >
      {isPro ? (
        <ThumbsUp className="size-3.5" strokeWidth={3} />
      ) : (
        <ThumbsDown className="size-3.5 text-white" strokeWidth={3} />
      )}
      <span className={`${space} text-xs font-bold ${isPro ? '' : 'text-white'}`}>
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
    <div className="flex flex-wrap gap-2">
      {ruleBasedChips.map((chip) => (
        <Chip key={`rule-${chip.label}`} chip={chip} />
      ))}
      {aiChips.map((chip) => (
        <Chip key={`ai-${chip.label}`} chip={chip} />
      ))}
      {showShimmer && (
        <>
          <div
            className={`${b5} ${roundedXl} ${shadow4} px-3 py-1.5 bg-gray-200 animate-pulse inline-flex items-center gap-1.5 h-[30px] w-[100px]`}
          />
          <div
            className={`${b5} ${roundedXl} ${shadow4} px-3 py-1.5 bg-gray-200 animate-pulse inline-flex items-center gap-1.5 h-[30px] w-[120px]`}
          />
        </>
      )}
    </div>
  );
}
