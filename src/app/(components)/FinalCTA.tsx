import { ChevronRight } from 'lucide-react';
import {
  finalCTAButtonIcon,
  finalCTAButtonRow,
  finalCTACard,
  finalCTAContainer,
  finalCTAInner,
  finalCTAPrimaryButton,
  finalCTASecondaryButton,
  finalCTASection,
  finalCTASubText,
  finalCTATitle,
} from '../consts';

export function FinalCTA() {
  return (
    <section id="learn-more" className={finalCTASection}>
      <div className={finalCTAContainer}>
        <div className={finalCTAInner}>
          {/* Card Container */}
          <div className={finalCTACard}>
            <h2 className={finalCTATitle}>
              START MAKING SMARTER MARKETPLACE DECISIONS
            </h2>
            
            <p className={finalCTASubText}>
              Join the movement of smart shoppers who never overpay
            </p>

            <div className={finalCTAButtonRow}>
              <a
                href="#hero"
                className={finalCTAPrimaryButton}
              >
                Get Started
                <ChevronRight className={finalCTAButtonIcon} strokeWidth={3} />
              </a>
              
              <button className={finalCTASecondaryButton}>
                Watch Demo
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
