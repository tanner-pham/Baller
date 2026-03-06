'use client';

import { useRef, useState, useEffect } from 'react';
import { Trophy, Scale } from 'lucide-react';
import type { VerdictResult } from '../../api/compare-verdict/types';
import {
  anton,
  space,
  b5,
  roundedXl,
  shadow6,
} from '../../consts';

interface VerdictCardProps {
  verdict: VerdictResult | null;
  isLoading: boolean;
  error: string;
  onReveal: (winnerSide: 'left' | 'right' | null) => void;
}

export function VerdictCard({ verdict, isLoading, error, onReveal }: VerdictCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isRevealed, setIsRevealed] = useState(false);

  // Set up IntersectionObserver ONLY when verdict data is loaded
  useEffect(() => {
    if (!verdict || !cardRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting) {
          setIsRevealed(true);

          let winnerSide: 'left' | 'right' | null = null;
          if (verdict.verdict === 'LEFT_EDGES_AHEAD') winnerSide = 'left';
          else if (verdict.verdict === 'RIGHT_EDGES_AHEAD') winnerSide = 'right';

          onReveal(winnerSide);
          observer.disconnect();
        }
      },
      { threshold: 0.3 },
    );

    observer.observe(cardRef.current);

    return () => {
      observer.disconnect();
    };
  }, [verdict, onReveal]);

  // Loading skeleton
  if (isLoading && !verdict) {
    return (
      <div className={`bg-white ${b5} ${roundedXl} ${shadow6} p-8`}>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-3/4" />
          <div className="h-4 bg-gray-200 rounded w-full" />
          <div className="h-4 bg-gray-200 rounded w-5/6" />
        </div>
      </div>
    );
  }

  // Error state (non-blocking)
  if (error && !verdict) {
    return (
      <div className={`bg-white ${b5} ${roundedXl} ${shadow6} p-8`}>
        <p className={`${space} text-sm font-semibold text-gray-400 text-center`}>
          {error}
        </p>
      </div>
    );
  }

  // No verdict yet
  if (!verdict) return null;

  const isTie = verdict.verdict === 'TOO_CLOSE_TO_CALL';
  const cardBg = isTie ? 'bg-[#FADF0B]' : 'bg-[#90EE90]';
  const Icon = isTie ? Scale : Trophy;

  return (
    <div
      ref={cardRef}
      className={`${cardBg} ${b5} ${roundedXl} ${shadow6} p-8 ${
        isRevealed
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 translate-y-4'
      } transition-all duration-700`}
    >
      <div className="flex items-center gap-3 mb-4">
        <Icon className="size-8" strokeWidth={2.5} />
        <h2 className={`${anton} text-2xl uppercase`}>
          {verdict.verdictHeadline}
        </h2>
      </div>
      <p className={`${space} text-base font-semibold text-gray-700`}>
        {verdict.verdictReasoning}
      </p>
    </div>
  );
}
