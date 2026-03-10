import { BarChart3, Search, Shield } from 'lucide-react';
import {
  howItWorksCard,
  howItWorksContainer,
  howItWorksGrid,
  howItWorksHeader,
  howItWorksIcon,
  howItWorksIconBox,
  howItWorksIconRow,
  howItWorksNumberBadge,
  howItWorksSection,
  howItWorksStepDescription,
  howItWorksStepTitle,
  howItWorksSubText,
  largeBoldFont,
} from '../consts';

const STEPS = [
  {
    icon: Search,
    title: 'Find a Listing',
    description: 'Browse Facebook Marketplace and copy the listing URL',
    color: '#FF6600',
    number: '01',
  },
  {
    icon: BarChart3,
    title: 'Get Analysis',
    description: 'Using AI, Baller analyzes market data and provides instant pricing insights',
    color: '#90EE90',
    number: '02',
  },
  {
    icon: Shield,
    title: 'Make Decision',
    description: 'Baller can review scam risks, fair price, and resale potential before buying',
    color: '#FF69B4',
    number: '03',
  },
] as const;

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className={howItWorksSection}
    >
      <div className={howItWorksContainer}>
        <div className={howItWorksHeader}>
          <h2 className={largeBoldFont}>
            HOW IT WORKS
          </h2>
          <p className={howItWorksSubText}>
            Three simple steps to smarter marketplace decisions
          </p>
        </div>

        <div className={howItWorksGrid}>
          {STEPS.map((step) => (
            <div
              key={step.number}
              className={howItWorksCard}
            >
              <div
                className={howItWorksNumberBadge}
                style={{ backgroundColor: step.color }}
              >
                {step.number}
              </div>

              <div className={howItWorksIconRow}>
                <div
                  className={howItWorksIconBox}
                  style={{ backgroundColor: step.color }}
                >
                  <step.icon className={howItWorksIcon} strokeWidth={3} />
                </div>
              </div>

              <h3 className={howItWorksStepTitle}>{step.title}</h3>
              <p className={howItWorksStepDescription}>
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
