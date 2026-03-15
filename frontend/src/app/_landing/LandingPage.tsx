import { Navbar } from '@/components/ui/navbar';
import { Hero } from './Hero';
import { Stats } from './Stats';
import { Features } from './Features';
import { Audiences } from './Audiences';
import { HowItWorks } from './HowItWorks';
import { CtaBanner } from './CtaBanner';
import { Footer } from './Footer';

export function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <Hero />
      <Stats />
      <Features />
      <Audiences />
      <HowItWorks />
      <CtaBanner />
      <Footer />
    </div>
  );
}
