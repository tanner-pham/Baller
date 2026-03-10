import {
  ChartNoAxesCombined,
  Gem,
  OctagonAlert,
  PiggyBank,
  type LucideIcon,
} from 'lucide-react';
import {
  featuresCard,
  featuresCardHeaderRow,
  featuresContainer,
  featuresDescription,
  featuresGrid,
  featuresHeader,
  featuresSection,
  featuresIcon,
  featuresSubText,
  featuresTitle,
  featuresAuthorIconBox,
  largeBoldFont,
} from '../consts';

interface Feature {
  title: string;
  description: string;
  icon: LucideIcon;
  color: string;
}

const FEATURES: Feature[] = [
  {
    title: 'Fair Market Price',
    description: 'Get instant price comparisons based on thousands of similar listings.',
    icon: PiggyBank,
    color: '#FADF0B',
  },
  {
    title: 'Scam Detection',
    description: 'AI-powered risk assessment flags suspicious listings and sellers.',
    icon: OctagonAlert,
    color: '#FF6600',
  },
  {
    title: 'Resale Potential',
    description: 'Discover if an item is worth flipping for profit on the marketplace.',
    icon: Gem,
    color: '#90EE90',
  },
  {
    title: 'Price History',
    description: 'See how prices have changed over time to spot trends and negotiate.',
    icon: ChartNoAxesCombined,
    color: '#FF69B4',
  },
];

export function Features() {
  return (
    <section
      id="features"
      className={featuresSection}
    >
      <div className={featuresContainer}>
        <div className={featuresHeader}>
          <h2 className={largeBoldFont}>
            POWERFUL FEATURES
          </h2>
          <p className={featuresSubText}>
            Everything you need to make informed marketplace decisions
          </p>
        </div>

        <div className={featuresGrid}>
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className={featuresCard}
            >
              <div className={featuresCardHeaderRow}>
                <div
                  className={featuresAuthorIconBox}
                  style={{ backgroundColor: feature.color }}
                >
                  <feature.icon className={featuresIcon} strokeWidth={2.5} />
                </div>
                <h3 className={featuresTitle}>{feature.title}</h3>
              </div>

              <p className={featuresDescription}>
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
