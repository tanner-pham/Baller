import { SimilarListings } from './(components)/SimilarListings';
import { CurrentListing } from './(components)/CurrentListing';
import { PricingAnalysis } from './(components)/PriceAnalysis';
import { Navigation } from '../(components)/Navigation';
import { parseFacebookMarketplaceListingUrl } from '../../lib/facebookMarketplaceListing';

const dummyListings = [
  {
    title: "MacBook Pro M3 14-inch",
    location: "Seattle",
    price: 1200,
    image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8",
    link: "https://www.facebook.com/marketplace/",
  },
  {
    title: "Dell XPS 15 OLED",
    location: "Bellevue",
    price: 500,
    image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853",
    link: "https://www.facebook.com/marketplace/",
  },
  {
    title: "ASUS ROG Zephyrus G14",
    location: "Bellevue",
    price: 900,
    image: "https://images.unsplash.com/photo-1593642532400-2682810df593",
    link: "https://www.facebook.com/marketplace/",
  },
  {
    title: "Lenovo ThinkPad X1 Carbon",
    location: "Renton",
    price: 1200,
    image: "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed",
    link: "https://www.facebook.com/marketplace/",
  },
  {
    title: "MacBook Pro M3 14-inch",
    location: "Renton",
    price: 1200,
    image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8",
    link: "https://www.facebook.com/marketplace/",
  },
  {
    title: "HP Spectre x360",
    location: "Olympia",
    price: 1000,
    image: "https://images.unsplash.com/photo-1541807084-5c52b6b3adef",
    link: "https://www.facebook.com/marketplace/",
  },
];

interface DashboardPageProps {
  searchParams: Promise<{
    listingUrl?: string | string[];
    itemId?: string | string[];
  }>;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const resolvedSearchParams = await searchParams;
  const listingUrlParam = Array.isArray(resolvedSearchParams.listingUrl)
    ? resolvedSearchParams.listingUrl[0]
    : resolvedSearchParams.listingUrl;

  // Keep listing URL parsing shared with Hero and ready for dashboard-side link input.
  const parsedListing = parseFacebookMarketplaceListingUrl(listingUrlParam ?? '');
  const fallbackListingLink = 'https://www.facebook.com/marketplace/item/123456789012345/';
  const listingLink = parsedListing?.normalizedUrl ?? fallbackListingLink;
  const listingsWithValidatedLinks = dummyListings.map((listing) => ({
    ...listing,
    link: listingLink,
  }));

  return (
    <main className="size-full overflow-y-auto bg-[#F5F5F0]">
      <Navigation />
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
    <div className="size-full overflow-y-auto bg-[#F5F5F0]">
      <SimilarListings listings={listingsWithValidatedLinks} />
    </div>
    </main>
  );
}
