'use client';

import { useRef, useState, useEffect } from 'react';
import { Trophy, Scale } from 'lucide-react';
import type { VerdictResult } from '../../api/compare-verdict/types';
import { verdictCardStyles } from '../../consts';

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
      <div className={verdictCardStyles.shell}>
        <div className={verdictCardStyles.skeleton}>
          <div className={verdictCardStyles.skeletonLineLg} />
          <div className={verdictCardStyles.skeletonLineSm} />
          <div className={verdictCardStyles.skeletonLineMd} />
        </div>
      </div>
    );
  }

  // Error state (non-blocking)
  if (error && !verdict) {
    return (
      <div className={verdictCardStyles.shell}>
        <p className={verdictCardStyles.errorText}>
          {error}
        </p>
      </div>
    );
  }

  // No verdict yet
  if (!verdict) return null;

  const isTie = verdict.verdict === 'TOO_CLOSE_TO_CALL';
  const cardBg = isTie ? verdictCardStyles.tieBg : verdictCardStyles.winBg;
  const Icon = isTie ? Scale : Trophy;

  return (
    <div
      ref={cardRef}
      className={`${verdictCardStyles.rootBase} ${cardBg} ${
        isRevealed
          ? verdictCardStyles.revealed
          : verdictCardStyles.hidden
      }`}
    >
      <div className={verdictCardStyles.headerRow}>
        <Icon className={verdictCardStyles.icon} strokeWidth={2.5} />
        <h2 className={verdictCardStyles.title}>
          {verdict.verdictHeadline}
        </h2>
      </div>
      <p className={verdictCardStyles.body}>
        {verdict.verdictReasoning}
      </p>
    </div>
  );
}
