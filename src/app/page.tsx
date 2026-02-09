import { Navigation } from './components/Navigation';
import { Hero } from './components/Hero';
import { HowItWorks } from './components/HowItWorks';
import { Features } from './components/Features';
import { FinalCTA } from './components/FinalCTA.tsx';
import { Footer } from './components/Footer';

export default function App() {
  return (
    <div className="size-full overflow-y-auto bg-[#F5F5F0]">
      <Navigation />
      <Hero />
      <HowItWorks />
      <Features />
      <FinalCTA />
      <Footer />
    </div>
  );
}
