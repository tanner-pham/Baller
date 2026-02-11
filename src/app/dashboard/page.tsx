import { CurrentListing } from './(components)/CurrentListing';

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
    </main>
  );
}
