import { DollarSign, AlertTriangle, TrendingUp, Clock } from 'lucide-react';

export function Features() {
  const features = [
    {
      icon: DollarSign,
      title: 'Fair Market Price',
      description: 'Get instant price comparisons based on thousands of similar listings.',
      authorIcon: '💰',
      color: '#FADF0B'
    },
    {
      icon: AlertTriangle,
      title: 'Scam Detection',
      description: 'AI-powered risk assessment flags suspicious listings and sellers.',
      authorIcon: '🛡️',
      color: '#FF6600'
    },
    {
      icon: TrendingUp,
      title: 'Resale Potential',
      description: 'Discover if an item is worth flipping for profit on the marketplace.',
      authorIcon: '📈',
      color: '#90EE90'
    },
    {
      icon: Clock,
      title: 'Price History',
      description: 'See how prices have changed over time to spot trends and negotiate.',
      authorIcon: '⏰',
      color: '#FF69B4'
    }
  ];

  return (
    <section id="features" className="relative py-20 lg:py-32 bg-[#F5F5F5] border-b-5 border-black overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="font-['Anton',sans-serif] text-6xl lg:text-7xl mb-4 text-black">
            POWERFUL FEATURES
          </h2>
          <p className="font-['Space_Grotesk',sans-serif] text-xl font-bold text-gray-700 max-w-2xl mx-auto">
            Everything you need to make informed marketplace decisions
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <div key={index} className="bg-white border-5 border-black p-8 shadow-[6px_6px_0px_0px_#000000] hover:shadow-[8px_8px_0px_0px_#000000] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all rounded-2xl">
              {/* Header with icon and author */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="size-16 rounded-xl border-5 border-black flex items-center justify-center text-3xl"
                       style={{ backgroundColor: feature.color }}>
                    {feature.authorIcon}
                  </div>
                  <div>
                    <h3 className="font-['Anton',sans-serif] text-2xl">
                      {feature.title}
                    </h3>
                  </div>
                </div>
              </div>

              {/* Description */}
              <p className="font-['Space_Grotesk',sans-serif] font-semibold text-gray-700 mb-6">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}