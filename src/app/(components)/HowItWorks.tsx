import { BarChart3, Search, Shield } from 'lucide-react';

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
      className="relative overflow-hidden border-b-5 border-black bg-[#FFFFFF] py-20 lg:py-32"
    >
      <div className="container mx-auto px-4">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-6xl text-black font-['Anton',sans-serif] lg:text-7xl">
            HOW IT WORKS
          </h2>
          <p className="mx-auto max-w-2xl text-xl font-bold text-gray-700 font-['Space_Grotesk',sans-serif]">
            Three simple steps to smarter marketplace decisions
          </p>
        </div>

        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 md:grid-cols-3">
          {STEPS.map((step) => (
            <div
              key={step.number}
              className="relative rounded-2xl border-5 border-black bg-white p-8 shadow-[6px_6px_0px_0px_#000000] transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[8px_8px_0px_0px_#000000]"
            >
              <div
                className="absolute -left-4 -top-4 flex size-12 items-center justify-center rounded-full border-5 border-black text-2xl font-['Anton',sans-serif]"
                style={{ backgroundColor: step.color }}
              >
                {step.number}
              </div>

              <div className="mb-6 flex justify-center">
                <div
                  className="flex size-20 items-center justify-center rounded-2xl border-5 border-black"
                  style={{ backgroundColor: step.color }}
                >
                  <step.icon className="size-10" strokeWidth={3} />
                </div>
              </div>

              <h3 className="mb-3 text-center text-3xl font-['Anton',sans-serif]">{step.title}</h3>
              <p className="text-center font-semibold text-gray-700 font-['Space_Grotesk',sans-serif]">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
