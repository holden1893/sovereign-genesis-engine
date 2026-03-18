import { Navigation } from '@/sections/Navigation';
import { Hero } from '@/sections/Hero';
import { ApiConfig } from '@/sections/ApiConfig';
import { SystemStatusSection } from '@/sections/SystemStatus';
import { GameGenerator } from '@/sections/GameGenerator';
import { GameGallery } from '@/sections/GameGallery';
import { TrainingMetrics } from '@/sections/TrainingMetrics';
import { Footer } from '@/sections/Footer';

function App() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Navigation />
      <main>
        <Hero />
        <ApiConfig />
        <SystemStatusSection />
        <GameGenerator />
        <GameGallery />
        <TrainingMetrics />
      </main>
      <Footer />
    </div>
  );
}

export default App;
