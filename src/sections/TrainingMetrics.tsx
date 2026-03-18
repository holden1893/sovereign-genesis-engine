import { useEffect, useState } from 'react';
import { TrendingUp, Activity, Target, Zap, RotateCcw, Play, Brain } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

// ─── Types ───────────────────────────────────────────────────

interface SimSample {
  timestamp: number;
  survivorRate: number;       // world balance
  narrativeTension: number;   // story quality
  agentCount: number;
  survivorCount: number;
  dominantFaction: string;
  emergentMechanics: string[];
  keyEventCount: number;
  genre: string;
  setting: string;
  worldSize: string;
}

interface TrainingIteration {
  iteration: number;
  timestamp: number;
  avgQuality: number;
  balanceScore: number;
  narrativeScore: number;
  emergenceScore: number;
  complexityScore: number;
  genre: string;
  dominantFaction: string;
  sampleCount: number;
}

// ─── Storage key ─────────────────────────────────────────────

const STORAGE_KEY = 'sovereign_genesis_training';

// ─── Score extractors ─────────────────────────────────────────

function scoreSample(sample: SimSample): TrainingIteration {
  // World balance — sweet spot is 40-70% survival
  // Too high = not enough conflict, too low = world eats everything
  const survRate = sample.survivorCount / sample.agentCount;
  const balanceScore = survRate < 0.3 ? survRate / 0.3
                     : survRate > 0.7 ? 1 - ((survRate - 0.7) / 0.3)
                     : 1.0;

  // Narrative score — tension is good, 0.4-0.8 is the sweet spot
  const narrativeScore = Math.min(1, sample.narrativeTension * 1.5);

  // Emergence score — more mechanics = richer world
  const emergenceScore = Math.min(1, sample.emergentMechanics.length / 5);

  // Complexity score — more key events = denser world
  const complexityScore = Math.min(1, sample.keyEventCount / 15);

  const avgQuality = (balanceScore + narrativeScore + emergenceScore + complexityScore) / 4;

  return {
    iteration: Date.now(),
    timestamp: sample.timestamp,
    avgQuality,
    balanceScore,
    narrativeScore,
    emergenceScore,
    complexityScore,
    genre: sample.genre,
    dominantFaction: sample.dominantFaction,
    sampleCount: 1,
  };
}

// ─── Storage helpers ──────────────────────────────────────────

export function recordSimulation(simData: {
  survivorCount: number;
  agentCount: number;
  narrativeThreads: Array<{ tension: number }>;
  recommendations: { emergentMechanics: string[] };
  keyEvents: unknown[];
  dominantFaction: string;
  genre?: string;
  setting?: string;
}) {
  try {
    const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') as SimSample[];
    const tension = simData.narrativeThreads?.[0]?.tension ?? 0.5;
    const sample: SimSample = {
      timestamp: Date.now(),
      survivorRate: simData.survivorCount / simData.agentCount,
      narrativeTension: tension,
      agentCount: simData.agentCount,
      survivorCount: simData.survivorCount,
      dominantFaction: simData.dominantFaction,
      emergentMechanics: simData.recommendations?.emergentMechanics ?? [],
      keyEventCount: simData.keyEvents?.length ?? 0,
      genre: simData.genre ?? 'unknown',
      setting: simData.setting ?? 'unknown',
      worldSize: simData.agentCount > 25 ? 'large' : simData.agentCount > 15 ? 'medium' : 'small',
    };
    existing.push(sample);
    // Keep last 50 samples
    const trimmed = existing.slice(-50);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // localStorage unavailable — silent fail
  }
}

function loadSamples(): SimSample[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function clearSamples() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch { /* silent */ }
}

// ─── Mini sparkline ───────────────────────────────────────────

function Sparkline({ values, color = '#00ff88' }: { values: number[]; color?: string }) {
  if (values.length < 2) return null;
  const w = 120;
  const h = 32;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 0.01;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w;
    const y = h - ((v - min) / range) * h;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={w} height={h} style={{ overflow: 'visible' }}>
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
        opacity="0.8"
      />
      <circle
        cx={parseFloat(pts.split(' ').pop()!.split(',')[0])}
        cy={parseFloat(pts.split(' ').pop()!.split(',')[1])}
        r="3"
        fill={color}
      />
    </svg>
  );
}

// ─── Score color ──────────────────────────────────────────────

function scoreColor(v: number): string {
  if (v >= 0.8) return '#00ff88';
  if (v >= 0.6) return '#ffbd2e';
  if (v >= 0.4) return '#ff9500';
  return '#ff3366';
}

function scoreLabel(v: number): string {
  if (v >= 0.8) return 'EXCELLENT';
  if (v >= 0.6) return 'GOOD';
  if (v >= 0.4) return 'DEVELOPING';
  return 'EARLY';
}

// ─── Main Component ───────────────────────────────────────────

export function TrainingMetrics() {
  const [samples, setSamples] = useState<SimSample[]>([]);
  const [iterations, setIterations] = useState<TrainingIteration[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const load = () => {
    const raw = loadSamples();
    setSamples(raw);
    setIterations(raw.map(scoreSample));
  };

  useEffect(() => {
    load();
    // Reload when storage changes (other tab or after sim runs)
    const handler = () => load();
    window.addEventListener('storage', handler);
    // Also poll every 3s to catch same-tab updates
    const poll = setInterval(load, 3000);
    return () => { window.removeEventListener('storage', handler); clearInterval(poll); };
  }, []);

  const avgOf = (field: keyof TrainingIteration) => {
    if (iterations.length === 0) return 0;
    return iterations.reduce((s, it) => s + (it[field] as number), 0) / iterations.length;
  };

  const recentTrend = iterations.slice(-10).map(it => it.avgQuality);
  const isImproving = recentTrend.length > 2 &&
    recentTrend[recentTrend.length - 1] > recentTrend[0];

  const handleClear = () => { clearSamples(); load(); };

  const handleRunSim = async () => {
    setIsRunning(true);
    // Trigger a training sim with a default spec
    try {
      const { runSimulation } = await import('@/lib/simulationEngine');
      const spec = {
        title: 'Training Run',
        genre: 'rpg' as const,
        setting: 'sci-fi' as const,
        style: 'stylized',
        target_platform: 'pc' as const,
        complexity: 'medium' as const,
        player_count: 1,
      };
      const result = runSimulation(spec, {
        agentCount: 30,
        maxTicks: 75,
        worldSize: 'medium',
        conflictFrequency: 0.4,
        tradeFrequency: 0.3,
        seed: Date.now(),
      });
      recordSimulation({
        ...result,
        genre: spec.genre,
        setting: spec.setting,
      });
      load();
    } catch (e) {
      console.error('Training sim failed:', e);
    }
    setIsRunning(false);
  };

  const overallQuality = avgOf('avgQuality');
  const balanceAvg = avgOf('balanceScore');
  const narrativeAvg = avgOf('narrativeScore');
  const emergenceAvg = avgOf('emergenceScore');
  const complexityAvg = avgOf('complexityScore');

  // Genre breakdown
  const genreCounts = samples.reduce((acc, s) => {
    acc[s.genre] = (acc[s.genre] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topGenre = Object.entries(genreCounts).sort((a, b) => b[1] - a[1])[0];

  return (
    <section id="training" className="py-20 px-4 bg-slate-950">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="text-center mb-12">
          <div style={{
            fontFamily: 'monospace',
            fontSize: '10px',
            letterSpacing: '3px',
            color: 'rgba(0,255,136,0.5)',
            marginBottom: '8px',
            textTransform: 'uppercase',
          }}>
            Self-Evolution Engine
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            The System Learns From Every World It Destroys
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Every simulation run feeds real quality signals back into the engine.
            {samples.length === 0
              ? ' Generate your first world to start training.'
              : ` ${samples.length} simulation${samples.length === 1 ? '' : 's'} recorded. The engine is ${isImproving ? 'improving' : 'calibrating'}.`
            }
          </p>
        </div>

        {/* Top stats */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          {[
            {
              label: 'Simulations Run',
              value: samples.length,
              icon: <RotateCcw className="w-5 h-5" style={{ color: '#cc88ff' }} />,
              color: '#cc88ff',
              sub: samples.length === 0 ? 'run your first sim' : `last: ${new Date(samples[samples.length-1]?.timestamp).toLocaleTimeString()}`,
            },
            {
              label: 'Overall Quality',
              value: samples.length ? `${(overallQuality * 100).toFixed(1)}%` : '—',
              icon: <Target className="w-5 h-5" style={{ color: scoreColor(overallQuality) }} />,
              color: scoreColor(overallQuality),
              sub: samples.length ? scoreLabel(overallQuality) : 'no data yet',
            },
            {
              label: 'Top Genre',
              value: topGenre ? topGenre[0].toUpperCase() : '—',
              icon: <Brain className="w-5 h-5" style={{ color: '#4488ff' }} />,
              color: '#4488ff',
              sub: topGenre ? `${topGenre[1]} run${topGenre[1] === 1 ? '' : 's'}` : 'no data yet',
            },
            {
              label: 'Trend',
              value: samples.length < 3 ? '—' : isImproving ? '↑ Rising' : '→ Stable',
              icon: <TrendingUp className="w-5 h-5" style={{ color: isImproving ? '#00ff88' : '#ffbd2e' }} />,
              color: isImproving ? '#00ff88' : '#ffbd2e',
              sub: recentTrend.length > 1 ? `last ${recentTrend.length} sims` : 'need 3+ sims',
            },
          ].map((stat, i) => (
            <Card key={i} style={{
              background: 'rgba(0,0,0,0.5)',
              border: `1px solid ${stat.color}22`,
              borderRadius: '8px',
            }}>
              <CardContent className="p-5">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '8px',
                    background: `${stat.color}18`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {stat.icon}
                  </div>
                  <div style={{ fontFamily: 'monospace', fontSize: '10px', color: 'rgba(255,255,255,0.4)', letterSpacing: '1px', textTransform: 'uppercase' }}>
                    {stat.label}
                  </div>
                </div>
                <div style={{ fontFamily: 'monospace', fontSize: '22px', fontWeight: '700', color: stat.color }}>
                  {stat.value}
                </div>
                <div style={{ fontFamily: 'monospace', fontSize: '10px', color: 'rgba(255,255,255,0.3)', marginTop: '4px' }}>
                  {stat.sub}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quality breakdown */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">

          {/* Score bars */}
          <Card style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(0,255,136,0.1)' }}>
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2" style={{ fontFamily: 'monospace', fontSize: '13px', letterSpacing: '1px' }}>
                <Activity className="w-4 h-4" style={{ color: '#00ff88' }} />
                QUALITY DIMENSIONS
              </CardTitle>
            </CardHeader>
            <CardContent>
              {samples.length === 0 ? (
                <div style={{ color: 'rgba(255,255,255,0.2)', fontFamily: 'monospace', fontSize: '12px', textAlign: 'center', padding: '24px 0' }}>
                  No simulation data yet.<br />Generate a world to start.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {[
                    { label: 'World Balance', value: balanceAvg, desc: 'Survivor rate sweet spot (40–70%)' },
                    { label: 'Narrative Quality', value: narrativeAvg, desc: 'Story tension and arc coherence' },
                    { label: 'Emergence Score', value: emergenceAvg, desc: 'Mechanics that arose organically' },
                    { label: 'World Complexity', value: complexityAvg, desc: 'Event density per simulation' },
                  ].map(({ label, value, desc }) => (
                    <div key={label}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <div>
                          <span style={{ fontFamily: 'monospace', fontSize: '11px', color: '#f1f5f9' }}>{label}</span>
                          <span style={{ fontFamily: 'monospace', fontSize: '10px', color: 'rgba(255,255,255,0.3)', marginLeft: '8px' }}>{desc}</span>
                        </div>
                        <span style={{ fontFamily: 'monospace', fontSize: '12px', color: scoreColor(value), fontWeight: '700' }}>
                          {(value * 100).toFixed(1)}%
                        </span>
                      </div>
                      <Progress value={value * 100} className="h-1.5" style={{ background: 'rgba(255,255,255,0.05)' }} />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Sparkline history */}
          <Card style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(0,255,136,0.1)' }}>
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2" style={{ fontFamily: 'monospace', fontSize: '13px', letterSpacing: '1px' }}>
                <TrendingUp className="w-4 h-4" style={{ color: '#00ff88' }} />
                QUALITY OVER TIME
              </CardTitle>
            </CardHeader>
            <CardContent>
              {iterations.length < 2 ? (
                <div style={{ color: 'rgba(255,255,255,0.2)', fontFamily: 'monospace', fontSize: '12px', textAlign: 'center', padding: '24px 0' }}>
                  Need 2+ simulations to plot trend.
                </div>
              ) : (
                <div>
                  <div style={{ marginBottom: '16px' }}>
                    <Sparkline values={iterations.map(it => it.avgQuality)} color="#00ff88" />
                  </div>
                  {[
                    { label: 'Balance', values: iterations.map(it => it.balanceScore), color: '#4488ff' },
                    { label: 'Narrative', values: iterations.map(it => it.narrativeScore), color: '#cc88ff' },
                    { label: 'Emergence', values: iterations.map(it => it.emergenceScore), color: '#ffaa00' },
                  ].map(({ label, values, color }) => (
                    <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                      <span style={{ fontFamily: 'monospace', fontSize: '10px', color: 'rgba(255,255,255,0.4)', width: '70px' }}>{label}</span>
                      <Sparkline values={values} color={color} />
                      <span style={{ fontFamily: 'monospace', fontSize: '11px', color, fontWeight: '700' }}>
                        {(values[values.length - 1] * 100).toFixed(0)}%
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent simulation log */}
        {samples.length > 0 && (
          <Card style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(0,255,136,0.1)', marginBottom: '24px' }}>
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2" style={{ fontFamily: 'monospace', fontSize: '13px', letterSpacing: '1px' }}>
                <Zap className="w-4 h-4" style={{ color: '#ffaa00' }} />
                SIMULATION LOG
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '240px', overflowY: 'auto' }}>
                {[...samples].reverse().slice(0, 10).map((s, i) => {
                  const scored = scoreSample(s);
                  return (
                    <div key={i} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '8px 12px',
                      background: 'rgba(255,255,255,0.02)',
                      borderRadius: '4px',
                      fontFamily: 'monospace',
                      fontSize: '11px',
                    }}>
                      <span style={{ color: 'rgba(255,255,255,0.3)', width: '60px', flexShrink: 0 }}>
                        {new Date(s.timestamp).toLocaleTimeString()}
                      </span>
                      <span style={{ color: '#4488ff', width: '70px' }}>{s.genre}</span>
                      <span style={{ color: '#94a3b8', width: '80px' }}>{s.setting}</span>
                      <span style={{ color: 'rgba(255,255,255,0.4)' }}>
                        {s.survivorCount}/{s.agentCount} survived
                      </span>
                      <span style={{ color: s.dominantFaction === 'chaos' ? '#ff3366' : '#00ff88', marginLeft: 'auto' }}>
                        {s.dominantFaction}
                      </span>
                      <span style={{ color: scoreColor(scored.avgQuality), fontWeight: '700', width: '45px', textAlign: 'right' }}>
                        {(scored.avgQuality * 100).toFixed(0)}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Controls */}
        <Card style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(0,255,136,0.1)' }}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h4 className="text-white font-semibold mb-1" style={{ fontFamily: 'monospace' }}>
                  {samples.length === 0 ? 'Start Training' : `Continue Training — Iteration ${samples.length + 1}`}
                </h4>
                <p className="text-slate-400 text-sm">
                  {samples.length === 0
                    ? 'Run a simulation to generate real quality metrics.'
                    : `Engine has processed ${samples.length} world${samples.length === 1 ? '' : 's'}. Keep going — quality converges around 50+ samples.`
                  }
                </p>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                {samples.length > 0 && (
                  <Button
                    onClick={handleClear}
                    variant="outline"
                    style={{ fontFamily: 'monospace', fontSize: '11px', borderColor: 'rgba(255,51,102,0.3)', color: '#ff3366' }}
                  >
                    RESET
                  </Button>
                )}
                <Button
                  onClick={handleRunSim}
                  disabled={isRunning}
                  style={{
                    background: isRunning ? 'rgba(0,255,136,0.1)' : 'rgba(0,255,136,0.2)',
                    border: '1px solid rgba(0,255,136,0.4)',
                    color: '#00ff88',
                    fontFamily: 'monospace',
                    fontSize: '11px',
                    letterSpacing: '1px',
                  }}
                >
                  {isRunning ? (
                    <><Activity className="w-4 h-4 mr-2 animate-spin" />SIMULATING...</>
                  ) : (
                    <><Play className="w-4 h-4 mr-2" />RUN TRAINING SIM</>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>
    </section>
  );
}
