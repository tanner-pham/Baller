import {
  ChartNoAxesCombined,
  Gem,
  OctagonAlert,
  PiggyBank,
  type LucideIcon,
} from 'lucide-react';

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
      className="relative overflow-hidden border-b-5 border-black bg-[#90EE90] py-20 lg:py-32"
    >
      <div className="container mx-auto px-4">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-6xl text-black font-['Anton',sans-serif] lg:text-7xl">
            POWERFUL FEATURES
          </h2>
          <p className="mx-auto max-w-2xl text-xl font-bold text-gray-700 font-['Space_Grotesk',sans-serif]">
            Everything you need to make informed marketplace decisions
          </p>
        </div>

        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 md:grid-cols-2">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="rounded-2xl border-5 border-black bg-white p-8 shadow-[6px_6px_0px_0px_#000000] transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[8px_8px_0px_0px_#000000]"
            >
              <div className="mb-6 flex items-center gap-4">
                <div
                  className="flex size-16 items-center justify-center rounded-xl border-5 border-black text-3xl"
                  style={{ backgroundColor: feature.color }}
                >
                  <feature.icon className="size-8 text-black" strokeWidth={2.5} />
                </div>
                <h3 className="text-2xl font-['Anton',sans-serif]">{feature.title}</h3>
              </div>

              <p className="mb-6 font-semibold text-gray-700 font-['Space_Grotesk',sans-serif]">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
