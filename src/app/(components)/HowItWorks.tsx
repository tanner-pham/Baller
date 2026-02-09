import { Search, BarChart3, Shield } from 'lucide-react';

export function HowItWorks() {
  const steps = [
    {
      icon: Search,
      title: 'Find a Listing',
      description: 'Browse Facebook Marketplace and copy the listing URL',
      color: '#FF6600',
      number: '01'
    },
    {
      icon: BarChart3,
      title: 'Get Analysis',
      description: 'Using AI, Baller analyzes market data and provides instant pricing insights',
      color: '#90EE90',
      number: '02'
    },
    {
      icon: Shield,
      title: 'Make Decision',
      description: 'Baller can review scam risks, fair price, and resale potential before buying',
      color: '#FF69B4',
      number: '03'
    }
  ];

  return (
    <section id="how-it-works" className="relative py-20 lg:py-32 bg-[#FADF0B] border-b-5 border-black overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="font-['Anton',sans-serif] text-6xl lg:text-7xl mb-4 text-black">
            HOW IT WORKS
          </h2>
          <p className="font-['Space_Grotesk',sans-serif] text-xl font-bold text-gray-700 max-w-2xl mx-auto">
            Three simple steps to smarter marketplace decisions
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {steps.map((step, index) => (
            <div key={index} className="bg-white border-5 border-black p-8 shadow-[6px_6px_0px_0px_#000000] hover:shadow-[8px_8px_0px_0px_#000000] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all rounded-2xl relative">
              {/* Number badge */}
              <div className="absolute -top-4 -left-4 size-12 rounded-full border-5 border-black flex items-center justify-center font-['Anton',sans-serif] text-2xl"
                   style={{ backgroundColor: step.color }}>
                {step.number}
              </div>
              
              {/* Icon */}
              <div className="mb-6 flex justify-center">
                <div className="size-20 rounded-2xl border-5 border-black flex items-center justify-center"
                     style={{ backgroundColor: step.color }}>
                  <step.icon className="size-10" strokeWidth={3} />
                </div>
              </div>

              {/* Content */}
              <h3 className="font-['Anton',sans-serif] text-3xl mb-3 text-center">
                {step.title}
              </h3>
              <p className="font-['Space_Grotesk',sans-serif] font-semibold text-gray-700 text-center">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}