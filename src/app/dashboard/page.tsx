import { SimilarListings } from './(components)/SimilarListings';


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

export default function DashboardPage() {
  return (
    <div className="size-full overflow-y-auto bg-[#F5F5F0]">
      <SimilarListings listings={dummyListings} />
    </div>
  );
}
