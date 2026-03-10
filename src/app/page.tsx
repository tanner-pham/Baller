import { Navigation } from './(components)/Navigation';
import { Hero } from './(components)/Hero';
import { HowItWorks } from './(components)/HowItWorks';
import { Features } from './(components)/Features';
import { FinalCTA } from './(components)/FinalCTA';
import { Footer } from './(components)/Footer';
import { appShell } from './consts';

export default function App() {
  return (
    <div className={appShell}>
      <Navigation />
      <Hero />
      <HowItWorks />
      <Features />
      <FinalCTA />
      <Footer />
    </div>
  );
}
