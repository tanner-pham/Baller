'use client';

import { analysisProgressStyles } from '../../consts';

interface AnalysisProgressProps {
  currentStep: number;
  steps: string[];
}

export function AnalysisProgress({ currentStep, steps }: AnalysisProgressProps) {
  return (
    <div className={analysisProgressStyles.outer}>
      <div className={analysisProgressStyles.card}>
        <h2 className={analysisProgressStyles.title}>
          Analyzing Listing...
        </h2>
        <div className={analysisProgressStyles.row}>
          {steps.map((label, i) => {
            const isLastStep = currentStep >= steps.length - 1;
            let barBg: string;
            if (isLastStep || i < currentStep) {
              barBg = analysisProgressStyles.barDone;
            } else if (i === currentStep) {
              barBg = analysisProgressStyles.barCurrent;
            } else {
              barBg = analysisProgressStyles.barPending;
            }

            const labelColor = i <= currentStep ? analysisProgressStyles.labelDone : analysisProgressStyles.labelPending;

            return (
              <div key={label} className={analysisProgressStyles.stepCol}>
                <div
                  data-testid={`step-bar-${i}`}
                  className={`${analysisProgressStyles.barBase} ${barBg}`}
                />
                <span className={`${analysisProgressStyles.labelBase} ${labelColor}`}>
                  {label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
