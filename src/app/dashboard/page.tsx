import { CurrentListing } from './(components)/CurrentListing';
import { PricingAnalysis } from './(components)/PriceAnalysis';

export default function DashboardPage() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <p className="mt-3">Placeholder for future routing</p>
      
      <div className="mt-8">
        <CurrentListing
          image="/images/macbook.jpg"
          price="$200"
          title='2018 Apple MacBook Pro 15"'
          description='2018 Apple MacBook Pro 15" with 6-core 2.2 GHz Intel i7, 16 GB RAM, 256 GB SSD, and 15.4" display, in near-pristine condition with no visible damage and will be factory reset before sale.'
          postedTime="2 hours ago"
          location="Sammamish, WA"
          sellerName="John Doe"
        />
      </div>
      <PricingAnalysis
        suggestedOffer='180'
        modelAccuracy='90'
        marketValue='230'
        topReasons= {['Battery health/cycle count isn\'t listed, and battery replacement can be a real cost',
          'A 2018 laptop is 6-7 years old, and even in great condition it\'s closer to end-of-support years than newer models',
          '256 GB is usable but relatively small by today\s standards',
          'Similar Intel 2018 15" listings vary a lot; you’re offering a fair midpoint that reflects that range'
        ]}
        negotiationTip={'Make it easy to say yes. Pair a reasonable offer with a clear, low-friction close: "Would you take $180? I can meet today, I\'m ready to pay immediately, and I can come to a spot that\'s convenient for you"'}></PricingAnalysis>
    </main>
  );
}
