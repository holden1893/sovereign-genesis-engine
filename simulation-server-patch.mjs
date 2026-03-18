// ============================================================
// SOVEREIGN GENESIS ENGINE — Server Patch
// Add these routes to your existing server.mjs
// ============================================================

// NOTE: Add this import at the top of server.mjs
// import { runSimulation } from './src/lib/simulationEngine.js';
// (After you compile TS → JS, or use ts-node/tsx)

// ─────────────────────────────────────────────
// SIMULATION ENDPOINT
// Runs the agent sim and returns enriched data
// ─────────────────────────────────────────────

app.post('/api/simulate', async (req, res) => {
  const { spec, agentCount = 20, maxTicks = 50, worldSize = 'medium' } = req.body;

  if (!spec) {
    return res.status(400).json({ error: 'GameSpec required' });
  }

  try {
    // Dynamic import (after TS compilation)
    const { runSimulation } = await import('./dist/lib/simulationEngine.js');

    const config = {
      agentCount: Math.min(agentCount, 100), // cap at 100 for perf
      maxTicks: Math.min(maxTicks, 200),
      worldSize,
      conflictFrequency: getConflictFrequency(spec.genre),
      tradeFrequency: getTradeFrequency(spec.genre),
      seed: Date.now(),
    };

    const simResult = runSimulation(spec, config);

    res.json({
      success: true,
      simulation: {
        totalTicks: simResult.totalTicks,
        agentCount: simResult.agentCount,
        survivorCount: simResult.survivorCount,
        dominantFaction: simResult.dominantFaction,
        emergentNarrative: simResult.emergentNarrative,
        narrativeThreads: simResult.narrativeThreads,
        keyEvents: simResult.keyEvents.slice(0, 10), // top 10 for API response
        worldState: simResult.worldState,
        recommendations: simResult.recommendations,
      }
    });

  } catch (err) {
    console.error('Simulation error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─────────────────────────────────────────────
// SIMULATE + GENERATE (the full pipeline)
// This is THE endpoint — sim first, gen second
// ─────────────────────────────────────────────

app.post('/api/generate-evolved', async (req, res) => {
  const spec = req.body;

  try {
    const { runSimulation, enrichSpecWithSimulation } = await import('./dist/lib/simulationEngine.js');

    // STEP 1: Simulate
    const config = {
      agentCount: 30,
      maxTicks: 75,
      worldSize: spec.complexity === 'complex' ? 'large' : spec.complexity === 'medium' ? 'medium' : 'small',
      conflictFrequency: getConflictFrequency(spec.genre),
      tradeFrequency: getTradeFrequency(spec.genre),
      seed: Date.now(),
    };

    const simResult = runSimulation(spec, config);
    const enrichedSpec = enrichSpecWithSimulation(spec, simResult);

    // STEP 2: Generate with enriched data
    // Override narrative_outline with emergent narrative from simulation
    const design = await generateGameDesign(spec);
    design.narrative_outline = simResult.emergentNarrative;

    // Inject emergent mechanics
    const emergentMechanics = simResult.recommendations.emergentMechanics;
    design.key_features = [
      ...design.key_features,
      ...emergentMechanics
    ].slice(0, 8);

    // Inject narrative hooks as quest seeds
    design.narrativeHooks = simResult.recommendations.narrativeHooks;
    design.simulationInsights = {
      dominantFaction: simResult.dominantFaction,
      worldConflictZone: simResult.worldState.mostContestedZone,
      startRecommendation: simResult.recommendations.recommendedStartZone,
      survivorRate: `${Math.round((simResult.survivorCount / simResult.agentCount) * 100)}%`,
    };

    // Rest of generation pipeline (same as /api/generate)
    const gameId = `game_${Date.now()}`;
    const assets = generateAssetsFromSpec(spec);
    const scenes = generateScenesFromSpec(spec, assets, simResult);
    const code = generateGameplayLogic(spec);
    const exportConfig = buildExportConfig(spec);

    const gamePackage = {
      id: gameId,
      spec: enrichedSpec,
      design,
      assets,
      scenes,
      code,
      export_config: exportConfig,
      simulation_summary: {
        narrative: simResult.emergentNarrative,
        threads: simResult.narrativeThreads.length,
        keyEvents: simResult.keyEvents.length,
        emergentMechanics: simResult.recommendations.emergentMechanics,
      },
      generated_at: new Date().toISOString(),
    };

    // Save
    const gameDir = path.join(GAMES_DIR, gameId);
    await fs.mkdir(gameDir, { recursive: true });
    await fs.writeFile(path.join(gameDir, 'game.json'), JSON.stringify(gamePackage, null, 2));

    res.json({
      success: true,
      game: gamePackage,
      download_url: `/api/games/${gameId}/download`,
    });

  } catch (err) {
    console.error('Evolved generation error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─────────────────────────────────────────────
// SSE ENDPOINT — Live simulation streaming
// Dashboard watches agents move in real time
// ─────────────────────────────────────────────

app.get('/api/simulate/stream', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const spec = JSON.parse(req.query.spec || '{}');
  const agentCount = parseInt(req.query.agentCount || '20');
  const maxTicks = parseInt(req.query.maxTicks || '50');

  // Stream tick-by-tick data
  // (simplified — real impl would run sim incrementally)
  try {
    const { runSimulation } = await import('./dist/lib/simulationEngine.js');
    const config = {
      agentCount,
      maxTicks,
      worldSize: 'medium',
      conflictFrequency: 0.3,
      tradeFrequency: 0.2,
      seed: Date.now(),
    };

    const result = runSimulation(spec, config);

    // Stream events as they "replay"
    let eventIndex = 0;
    const interval = setInterval(() => {
      if (eventIndex >= result.rawEvents.length) {
        res.write(`data: ${JSON.stringify({ type: 'complete', result: {
          emergentNarrative: result.emergentNarrative,
          recommendations: result.recommendations,
          survivorCount: result.survivorCount,
        }})}\n\n`);
        clearInterval(interval);
        res.end();
        return;
      }

      const batch = result.rawEvents.slice(eventIndex, eventIndex + 3);
      res.write(`data: ${JSON.stringify({ type: 'events', events: batch })}\n\n`);
      eventIndex += 3;
    }, 100);

    req.on('close', () => clearInterval(interval));

  } catch (err) {
    res.write(`data: ${JSON.stringify({ type: 'error', message: err.message })}\n\n`);
    res.end();
  }
});

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

function getConflictFrequency(genre) {
  const freq = { fps: 0.6, rpg: 0.4, survival: 0.5, platformer: 0.3, puzzle: 0.1, racing: 0.2 };
  return freq[genre] ?? 0.4;
}

function getTradeFrequency(genre) {
  const freq = { fps: 0.1, rpg: 0.5, survival: 0.4, platformer: 0.2, puzzle: 0.3, racing: 0.1 };
  return freq[genre] ?? 0.3;
}

function generateAssetsFromSpec(spec) {
  // Re-use your existing asset generation logic from server.mjs
  // This is a reference — point to your existing generateMesh / asset generation
  return [];
}

function generateScenesFromSpec(spec, assets, simResult) {
  // Enriched scenes use simResult.worldState for zone names
  const scenes = [];
  const numScenes = spec.complexity === 'complex' ? 3 : 1;

  for (let i = 0; i < numScenes; i++) {
    scenes.push({
      name: i === 0
        ? simResult.worldState.mostPeacefulZone.replace(/\s+/g, '_').toLowerCase()
        : `level_0${i + 1}`,
      asset_count: Math.min(assets.length, 10),
      simulation_origin: {
        zone: i === 0 ? simResult.worldState.mostPeacefulZone : simResult.worldState.mostContestedZone,
        narrative_tension: simResult.narrativeThreads[0]?.tension ?? 0.5,
      },
    });
  }
  return scenes;
}

function buildExportConfig(spec) {
  const formats = { pc: 'exe/dll', console: 'pkg', mobile: 'apk/ipa', web: 'wasm/js' };
  return {
    platform: spec.target_platform,
    format: formats[spec.target_platform] ?? 'zip',
    engine: 'Unity/Unreal/Godot',
  };
}
