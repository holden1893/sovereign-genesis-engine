import { useState } from 'react';
import { Navigation } from '@/sections/Navigation';
import { Hero } from '@/sections/Hero';
import { ApiConfig } from '@/sections/ApiConfig';
import { SystemStatusSection } from '@/sections/SystemStatus';
import ChatGameBuilder from '@/sections/ChatGameBuilder';
import LivePreview from '@/sections/LivePreview';
import SimulationVisualizer from '@/sections/SimulationVisualizer';
import { GameGallery } from '@/sections/GameGallery';
import { TrainingMetrics } from '@/sections/TrainingMetrics';
import { Footer } from '@/sections/Footer';
import type { GamePackage, GameSpec } from '@/types/game';
import { generateGame } from '@/lib/gameGenerator';

function App() {
  const [currentSpec, setCurrentSpec] = useState<Partial<GameSpec> | null>(null);
  const [gamePackage, setGamePackage] = useState<GamePackage | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async (spec: GameSpec) => {
    setIsGenerating(true);
    setGamePackage(null);

    // Small delay so the loading state is visible
    await new Promise(r => setTimeout(r, 800));

    try {
      // Try backend first, fall back to client-side
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(spec),
      });

      if (res.ok) {
        const data = await res.json();
        setGamePackage(data.game);
      } else {
        // Client-side fallback
        const pkg = generateGame(spec);
        setGamePackage(pkg);
      }
    } catch {
      // Offline fallback
      const pkg = generateGame(spec);
      setGamePackage(pkg);
    }

    setIsGenerating(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Navigation />
      <main>
        <Hero />
        <ApiConfig />
        <SystemStatusSection />

        {/* Chat-based world builder — replaces old dropdown form */}
        <ChatGameBuilder
          onGenerate={handleGenerate}
          onSpecUpdate={setCurrentSpec}
        />

        {/* Live preview — shows output as it generates */}
        <LivePreview
          gamePackage={gamePackage}
          isGenerating={isGenerating}
          spec={currentSpec}
        />

        {/* Simulation visualizer */}
        <section style={{ background: '#050a0f', padding: '80px 24px' }}>
          <div style={{ maxWidth: '900px', margin: '0 auto' }}>
            <div style={{
              fontFamily: 'monospace',
              fontSize: '10px',
              letterSpacing: '3px',
              color: 'rgba(0,255,136,0.5)',
              marginBottom: '8px',
            }}>
              SIMULATION LAYER
            </div>
            <h2 style={{
              fontFamily: 'monospace',
              fontSize: 'clamp(20px, 3vw, 28px)',
              fontWeight: '700',
              color: '#f1f5f9',
              margin: '0 0 32px',
            }}>
              Watch your world tear itself apart.<br />
              <span style={{ color: '#00ff88' }}>Then we build from what survived.</span>
            </h2>
            <SimulationVisualizer spec={currentSpec ?? undefined} />
          </div>
        </section>

        <GameGallery />
        <TrainingMetrics />
      </main>
      <Footer />
    </div>
  );
}

export default App;
