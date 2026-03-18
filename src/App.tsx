import { useState, useRef } from 'react';
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
import { runSimulation } from '@/lib/simulationEngine';

function App() {
  const [currentSpec, setCurrentSpec] = useState<Partial<GameSpec> | null>(null);
  const [gamePackage, setGamePackage] = useState<GamePackage | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [simSpec, setSimSpec] = useState<Partial<GameSpec> | null>(null);
  const simRef = useRef<HTMLDivElement>(null);

  const handleGenerate = async (spec: GameSpec) => {
    setIsGenerating(true);
    setGamePackage(null);

    // STEP 1 — scroll to simulation so user watches it run
    simRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

    // STEP 2 — run simulation FIRST with the spec
    setSimSpec(spec);
    const simResult = runSimulation(spec, {
      agentCount: 30,
      maxTicks: 75,
      worldSize: spec.complexity === "complex" ? "large"
               : spec.complexity === "medium" ? "medium" : "small",
      conflictFrequency: spec.genre === "fps" ? 0.6
                       : spec.genre === "survival" ? 0.5 : 0.4,
      tradeFrequency: spec.genre === "rpg" ? 0.5
                    : spec.genre === "survival" ? 0.4 : 0.2,
      seed: Date.now(),
    });

    // Small pause — let user see simulation completed
    await new Promise(r => setTimeout(r, 600));

    try {
      // STEP 3 — try backend with sim-enriched spec
      const enrichedSpec = {
        ...spec,
        simulationData: {
          emergentNarrative: simResult.emergentNarrative,
          dominantFaction: simResult.dominantFaction,
          survivorCount: simResult.survivorCount,
          agentCount: simResult.agentCount,
          worldState: simResult.worldState,
          recommendations: simResult.recommendations,
          narrativeThreads: simResult.narrativeThreads,
          keyEvents: simResult.keyEvents,
        }
      };

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(enrichedSpec),
      });

      if (res.ok) {
        const data = await res.json();
        // Inject sim data into the returned package
        data.game.design.narrative_outline = simResult.emergentNarrative;
        data.game.design.key_features = [
          ...data.game.design.key_features,
          ...simResult.recommendations.emergentMechanics,
        ].slice(0, 8);
        setGamePackage(data.game);
      } else {
        // Client-side fallback — still enriched with sim
        const pkg = generateGame(spec);
        pkg.design.narrative_outline = simResult.emergentNarrative;
        pkg.design.key_features = [
          ...pkg.design.key_features,
          ...simResult.recommendations.emergentMechanics,
        ].slice(0, 8);
        setGamePackage(pkg);
      }
    } catch {
      const pkg = generateGame(spec);
      pkg.design.narrative_outline = simResult.emergentNarrative;
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

        {/* STEP 1: Chat builder — describes the world */}
        <ChatGameBuilder
          onGenerate={handleGenerate}
          onSpecUpdate={setCurrentSpec}
        />

        {/* STEP 2: Simulation — runs agents through the world */}
        <div ref={simRef}>
          <section style={{ background: "#050a0f", padding: "80px 24px" }}>
            <div style={{ maxWidth: "900px", margin: "0 auto" }}>
              <div style={{
                fontFamily: "monospace",
                fontSize: "10px",
                letterSpacing: "3px",
                color: "rgba(0,255,136,0.5)",
                marginBottom: "8px",
              }}>
                SIMULATION LAYER
              </div>
              <h2 style={{
                fontFamily: "monospace",
                fontSize: "clamp(20px, 3vw, 28px)",
                fontWeight: "700",
                color: "#f1f5f9",
                margin: "0 0 32px",
              }}>
                {simSpec
                  ? <>Simulating <span style={{ color: "#00ff88" }}>{(simSpec as GameSpec).title ?? "your world"}</span>...</>
                  : <>Watch your world tear itself apart.<br />
                    <span style={{ color: "#00ff88" }}>Then we build from what survived.</span>
                  </>
                }
              </h2>
              <SimulationVisualizer spec={simSpec ?? currentSpec ?? undefined} />
            </div>
          </section>
        </div>

        {/* STEP 3: Live preview — shows enriched output */}
        <LivePreview
          gamePackage={gamePackage}
          isGenerating={isGenerating}
        />

        <GameGallery />
        <TrainingMetrics />
      </main>
      <Footer />
    </div>
  );
}

export default App;
