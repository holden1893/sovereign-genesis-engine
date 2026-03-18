// ============================================================
// src/sections/SimulationVisualizer.tsx
// Live agent simulation display — the money shot for your demo
// Drop this into your existing dashboard
// ============================================================

import { useState, useEffect, useRef, useCallback } from "react";
import { recordSimulation } from "@/sections/TrainingMetrics";

// ─── Types (mirrors simulationEngine.ts) ───────────────────

interface Agent {
  id: string;
  name: string;
  role: string;
  state: string;
  alignment: "order" | "chaos" | "neutral";
  health: number;
  alive: boolean;
  position: { x: number; y: number; zone: string };
  narrativeWeight: number;
}

interface SimEvent {
  id: string;
  tick: number;
  type: string;
  actorIds: string[];
  zoneId: string;
  description: string;
  narrativeImpact: number;
}

interface NarrativeThread {
  id: string;
  arc: string;
  protagonistId: string;
  tension: number;
  predictedOutcome: string;
}

interface SimResult {
  emergentNarrative: string;
  dominantFaction: string;
  survivorCount: number;
  agentCount: number;
  narrativeThreads: NarrativeThread[];
  keyEvents: SimEvent[];
  worldState: {
    mostContestedZone: string;
    mostPeacefulZone: string;
    powerVacuums: string[];
    tradeHubs: string[];
  };
  recommendations: {
    emergentMechanics: string[];
    narrativeHooks: string[];
    recommendedStartZone: string;
  };
}

interface GameSpec {
  title: string;
  genre: string;
  setting: string;
  complexity: string;
  style: string;
  target_platform: string;
  player_count: number;
}

// ─── Seeded RNG (mirrors engine) ────────────────────────────

class SeededRandom {
  private seed: number;
  constructor(seed: number) { this.seed = seed; }
  next(): number {
    this.seed = (this.seed * 1664525 + 1013904223) & 0xffffffff;
    return ((this.seed >>> 0) / 0xffffffff);
  }
  between(min: number, max: number) { return min + this.next() * (max - min); }
  pick<T>(arr: T[]): T { return arr[Math.floor(this.next() * arr.length)]; }
  chance(p: number) { return this.next() < p; }
}

// ─── Mini client-side sim (for demo without backend) ────────

function runClientSim(spec: GameSpec, agentCount: number, ticks: number) {
  const rng = new SeededRandom(Date.now());

  

  const zones = ["Zone Alpha", "Zone Beta", "Zone Gamma", "Zone Delta", "Zone Epsilon"];
  const namePool = spec.setting === "sci-fi"
    ? ["Zara", "Kade", "Nyx", "Vex", "Orion", "Lyra", "Dex", "Cael"]
    : spec.setting === "fantasy"
    ? ["Aldric", "Seraphine", "Theron", "Mira", "Caelum", "Isolde"]
    : ["Alex", "Jordan", "Casey", "Morgan", "Riley", "Quinn"];

  const roles = ["hero", "villain", "neutral", "merchant", "guardian", "wanderer"];
  const alignments: Array<"order" | "chaos" | "neutral"> = ["order", "chaos", "neutral"];

  // Spawn agents
  const agents: Agent[] = Array.from({ length: agentCount }, (_, i) => ({
    id: `agent_${i}`,
    name: rng.pick(namePool),
    role: i === 0 ? "hero" : i === 1 ? "villain" : rng.pick(roles),
    state: "exploring",
    alignment: i === 0 ? "order" : i === 1 ? "chaos" : rng.pick(alignments),
    health: 100,
    alive: true,
    position: { x: rng.between(5, 95), y: rng.between(5, 95), zone: rng.pick(zones) },
    narrativeWeight: i < 2 ? 1.0 : rng.between(0.1, 0.6),
  }));

  const allEvents: SimEvent[] = [];
  const snapshots: Agent[][] = [];

  // Tick loop
  for (let t = 0; t < ticks; t++) {
    const snap = agents.map(a => ({ ...a, position: { ...a.position } }));
    snapshots.push(snap);

    for (const agent of agents) {
      if (!agent.alive) continue;

      // Move
      agent.position.x = Math.max(2, Math.min(98, agent.position.x + rng.between(-8, 8)));
      agent.position.y = Math.max(2, Math.min(98, agent.position.y + rng.between(-8, 8)));
      if (rng.chance(0.15)) agent.position.zone = rng.pick(zones);

      // Combat
      const enemies = agents.filter(a =>
        a.alive && a.id !== agent.id && a.alignment !== agent.alignment &&
        Math.hypot(a.position.x - agent.position.x, a.position.y - agent.position.y) < 15 &&
        rng.chance(0.35)
      );

      if (enemies.length > 0) {
        const target = enemies[0];
        const dmg = Math.floor(rng.between(10, 30));
        target.health -= dmg;
        agent.state = "pursuing";
        target.state = "fleeing";

        allEvents.push({
          id: `evt_${t}_${agent.id}`,
          tick: t,
          type: "combat",
          actorIds: [agent.id, target.id],
          zoneId: agent.position.zone,
          description: `${agent.name} attacks ${target.name} for ${dmg} damage`,
          narrativeImpact: (agent.narrativeWeight + target.narrativeWeight) / 2,
        });

        if (target.health <= 0) {
          target.alive = false;
          target.state = "dead";
          allEvents.push({
            id: `evt_death_${t}_${target.id}`,
            tick: t,
            type: "death",
            actorIds: [agent.id, target.id],
            zoneId: agent.position.zone,
            description: `${target.name} is slain by ${agent.name}`,
            narrativeImpact: target.narrativeWeight,
          });
        }
      } else if (rng.chance(0.2)) {
        agent.state = "exploring";
        if (rng.chance(0.15)) {
          allEvents.push({
            id: `evt_disc_${t}_${agent.id}`,
            tick: t,
            type: "discovery",
            actorIds: [agent.id],
            zoneId: agent.position.zone,
            description: `${agent.name} discovers a hidden cache in ${agent.position.zone}`,
            narrativeImpact: 0.3,
          });
        }
      }
    }
  }

  // Build result
  const survivors = agents.filter(a => a.alive);
  const hero = agents.find(a => a.role === "hero");
  const villain = agents.find(a => a.role === "villain");

  const keyEvents = allEvents
    .filter(e => e.narrativeImpact > 0.4)
    .sort((a, b) => b.narrativeImpact - a.narrativeImpact)
    .slice(0, 15);

  const narrative = `In a ${spec.setting} world where ${
    !hero?.alive ? "even heroes fall" : "champions still rise"
  }, ${survivors.length} of ${agentCount} agents survived ${ticks} ticks of brutal simulation. ${
    hero?.alive
      ? `${hero.name} emerges as a force of order, having witnessed ${allEvents.filter(e => e.actorIds.includes(hero.id) && e.type === "combat").length} battles.`
      : `The hero's fall left a power vacuum that chaos rushed to fill.`
  } The world's story has already begun — the player inherits what survived.`;

  return {
    snapshots,
    result: {
      emergentNarrative: narrative,
      dominantFaction: survivors.filter(a => a.alignment === "chaos").length >
                        survivors.filter(a => a.alignment === "order").length ? "chaos" : "order",
      survivorCount: survivors.length,
      agentCount,
      narrativeThreads: [
        {
          id: "main",
          arc: hero?.alive ? "rise" : "tragedy",
          protagonistId: hero?.id ?? "",
          tension: allEvents.filter(e => e.type === "combat").length / (ticks * 0.3),
          predictedOutcome: hero?.alive
            ? `${hero.name} will face ${villain?.name ?? "the darkness"} in the final act.`
            : `The hero has fallen. Someone must take up the mantle.`,
        }
      ],
      keyEvents,
      worldState: {
        mostContestedZone: zones[2],
        mostPeacefulZone: zones[0],
        powerVacuums: zones.slice(1, 3),
        tradeHubs: zones.slice(3),
      },
      recommendations: {
        emergentMechanics: ["faction_warfare", "territorial_control", "exploration_reward_loop"],
        narrativeHooks: [
          "A power vacuum demands to be filled — the player's first choice defines everything.",
          "The simulation has determined this world's pressure points. Enter knowing where it hurts.",
        ],
        recommendedStartZone: zones[0],
      },
    } as SimResult,
    agents,
  };
}

// ─── COLOR UTILS ─────────────────────────────────────────────

const ALIGNMENT_COLORS = {
  order: "#00ff88",
  chaos: "#ff3366",
  neutral: "#aaaaaa",
};

const EVENT_COLORS: Record<string, string> = {
  combat: "#ff3366",
  death: "#ff0044",
  discovery: "#00ff88",
  trade: "#ffaa00",
  quest_complete: "#4488ff",
  alliance: "#44ffee",
  betrayal: "#ff6600",
};



// ─── MAIN COMPONENT ──────────────────────────────────────────

export default function SimulationVisualizer({ spec }: { spec?: Partial<GameSpec> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [currentTick, setCurrentTick] = useState(0);
  const [totalTicks] = useState(80);
  const [agentCount] = useState(24);
  const [liveEvents, setLiveEvents] = useState<SimEvent[]>([]);
  const [simResult, setSimResult] = useState<SimResult | null>(null);
  const [_snapshots, setSnapshots] = useState<Agent[][]>([]);
  const [_currentAgents, setCurrentAgents] = useState<Agent[]>([]);
  const tickRef = useRef(0);
  const snapshotsRef = useRef<Agent[][]>([]);

  // Wire sim completion into training loop
  useEffect(() => {
    recordSimulation({
      survivorCount: sr.survivorCount,
      agentCount: sr.agentCount,
      narrativeThreads: sr.narrativeThreads,
      recommendations: sr.recommendations,
      keyEvents: sr.keyEvents,
      dominantFaction: sr.dominantFaction,
      genre: defaultSpec.genre,
      setting: defaultSpec.setting,
    });
  }, [isDone]);

  const defaultSpec: GameSpec = {
    title: spec?.title ?? "SOVEREIGN GENESIS",
    genre: spec?.genre ?? "rpg",
    setting: spec?.setting ?? "sci-fi",
    complexity: spec?.complexity ?? "medium",
    style: spec?.style ?? "realistic",
    target_platform: spec?.target_platform ?? "pc",
    player_count: spec?.player_count ?? 1,
  };

  const runSim = useCallback(() => {
    const { snapshots: snaps, result, agents } = runClientSim(defaultSpec, agentCount, totalTicks);
    setSnapshots(snaps);
    snapshotsRef.current = snaps;
    setSimResult(result);
    setCurrentAgents(agents);
    setLiveEvents([]);
    setCurrentTick(0);
    tickRef.current = 0;
    setIsDone(false);
    setIsRunning(true);
  }, [spec]);

  // Draw loop
  useEffect(() => {
    if (!isRunning) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const W = canvas.width;
    const H = canvas.height;

    let lastTime = 0;
    const SPEED = 80; // ms per tick

    const draw = (time: number) => {
      if (time - lastTime < SPEED) {
        animRef.current = requestAnimationFrame(draw);
        return;
      }
      lastTime = time;

      const tick = tickRef.current;
      if (tick >= snapshotsRef.current.length) {
        setIsDone(true);
        setIsRunning(false);
        return;
      }

      const agents = snapshotsRef.current[tick];

      // ── BACKGROUND ──
      ctx.fillStyle = "#050a0f";
      ctx.fillRect(0, 0, W, H);

      // Grid
      ctx.strokeStyle = "rgba(0,255,136,0.04)";
      ctx.lineWidth = 1;
      for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
      for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

      // Scan line effect
      const scanY = (tick * 3) % H;
      const grad = ctx.createLinearGradient(0, scanY - 20, 0, scanY + 20);
      grad.addColorStop(0, "rgba(0,255,136,0)");
      grad.addColorStop(0.5, "rgba(0,255,136,0.04)");
      grad.addColorStop(1, "rgba(0,255,136,0)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, scanY - 20, W, 40);

      // ── AGENT TRAILS ──
      if (tick > 2) {
        for (let t = Math.max(0, tick - 4); t < tick; t++) {
          const prev = snapshotsRef.current[t];
          const alpha = (t - (tick - 4)) / 4 * 0.15;
          for (const pa of prev) {
            if (!pa.alive) continue;
            const color = ALIGNMENT_COLORS[pa.alignment];
            ctx.beginPath();
            ctx.arc(pa.position.x / 100 * W, pa.position.y / 100 * H, 3, 0, Math.PI * 2);
            ctx.fillStyle = color.replace(")", `,${alpha})`).replace("rgb", "rgba").replace("#", "rgba(").replace(/^rgba\(([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2}),/, (_, r, g, b) =>
              `rgba(${parseInt(r,16)},${parseInt(g,16)},${parseInt(b,16)},`);
            ctx.fillStyle = `${color}${Math.floor(alpha * 255).toString(16).padStart(2, '0')}`;
            ctx.fill();
          }
        }
      }

      // ── AGENTS ──
      for (const agent of agents) {
        const x = agent.position.x / 100 * W;
        const y = agent.position.y / 100 * H;
        const color = ALIGNMENT_COLORS[agent.alignment];
        const isHero = agent.role === "hero";
        const isVillain = agent.role === "villain";

        if (!agent.alive) {
          // Dead agent — faded X
          ctx.strokeStyle = "rgba(255,0,68,0.3)";
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(x - 5, y - 5); ctx.lineTo(x + 5, y + 5); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(x + 5, y - 5); ctx.lineTo(x - 5, y + 5); ctx.stroke();
          continue;
        }

        // Glow
        const glowSize = (isHero || isVillain) ? 20 : 12;
        const glow = ctx.createRadialGradient(x, y, 0, x, y, glowSize);
        glow.addColorStop(0, `${color}40`);
        glow.addColorStop(1, `${color}00`);
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(x, y, glowSize, 0, Math.PI * 2);
        ctx.fill();

        // Core dot
        const size = isHero ? 7 : isVillain ? 6 : 4;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();

        // Hero/villain ring
        if (isHero || isVillain) {
          ctx.beginPath();
          ctx.arc(x, y, size + 4, 0, Math.PI * 2);
          ctx.strokeStyle = color;
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }

        // Health bar
        const healthW = 20;
        const hp = agent.health / 100;
        ctx.fillStyle = "rgba(0,0,0,0.6)";
        ctx.fillRect(x - healthW / 2, y + size + 3, healthW, 3);
        ctx.fillStyle = hp > 0.6 ? "#00ff88" : hp > 0.3 ? "#ffaa00" : "#ff3366";
        ctx.fillRect(x - healthW / 2, y + size + 3, healthW * hp, 3);

        // Name (hero/villain only)
        if (isHero || isVillain) {
          ctx.font = "9px monospace";
          ctx.fillStyle = color;
          ctx.textAlign = "center";
          ctx.fillText(agent.name, x, y - size - 5);
        }
      }

      // ── TICK COUNTER ──
      ctx.font = "bold 11px monospace";
      ctx.fillStyle = "rgba(0,255,136,0.5)";
      ctx.textAlign = "left";
      ctx.fillText(`TICK ${String(tick).padStart(3, "0")} / ${String(totalTicks).padStart(3, "0")}`, 8, 16);

      const alive = agents.filter(a => a.alive).length;
      ctx.fillText(`AGENTS: ${alive}/${agents.length}`, 8, 30);

      tickRef.current = tick + 1;
      setCurrentTick(tick + 1);
      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [isRunning]);

  // Collect live events
  useEffect(() => {
    if (!isRunning || !simResult) return;
    const relevant = simResult.keyEvents.filter(e => e.tick <= currentTick);
    setLiveEvents(relevant.slice(-8));
  }, [currentTick, isRunning]);

  return (
    <div style={{
      background: "#050a0f",
      border: "1px solid rgba(0,255,136,0.15)",
      borderRadius: "8px",
      overflow: "hidden",
      fontFamily: "monospace",
    }}>
      {/* Header */}
      <div style={{
        padding: "12px 16px",
        borderBottom: "1px solid rgba(0,255,136,0.1)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <div>
          <div style={{ color: "#00ff88", fontSize: "11px", letterSpacing: "2px", opacity: 0.7 }}>
            SOVEREIGN GENESIS ENGINE
          </div>
          <div style={{ color: "#ffffff", fontSize: "14px", fontWeight: "bold", marginTop: "2px" }}>
            Narrative Prediction Layer
          </div>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          {isRunning && (
            <div style={{
              width: "8px", height: "8px", borderRadius: "50%",
              background: "#00ff88",
              animation: "pulse 1s infinite",
            }} />
          )}
          <button
            onClick={runSim}
            disabled={isRunning}
            style={{
              background: isRunning ? "rgba(0,255,136,0.1)" : "rgba(0,255,136,0.2)",
              border: "1px solid rgba(0,255,136,0.4)",
              color: "#00ff88",
              padding: "6px 16px",
              borderRadius: "4px",
              cursor: isRunning ? "not-allowed" : "pointer",
              fontSize: "11px",
              letterSpacing: "1px",
            }}
          >
            {isRunning ? "SIMULATING..." : isDone ? "RUN AGAIN" : "RUN SIMULATION"}
          </button>
        </div>
      </div>

      <div style={{ display: "flex", gap: 0 }}>
        {/* Canvas */}
        <div style={{ flex: 1, position: "relative" }}>
          <canvas
            ref={canvasRef}
            width={500}
            height={360}
            style={{ display: "block", width: "100%", height: "360px" }}
          />
          {!isRunning && !isDone && (
            <div style={{
              position: "absolute", inset: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              background: "rgba(5,10,15,0.8)",
              color: "rgba(0,255,136,0.4)",
              fontSize: "12px",
              letterSpacing: "2px",
            }}>
              AWAITING SIMULATION
            </div>
          )}
        </div>

        {/* Side panel */}
        <div style={{
          width: "220px",
          borderLeft: "1px solid rgba(0,255,136,0.1)",
          display: "flex",
          flexDirection: "column",
        }}>
          {/* Legend */}
          <div style={{ padding: "12px", borderBottom: "1px solid rgba(0,255,136,0.08)" }}>
            <div style={{ color: "rgba(0,255,136,0.5)", fontSize: "9px", letterSpacing: "1px", marginBottom: "8px" }}>
              FACTION KEY
            </div>
            {Object.entries(ALIGNMENT_COLORS).map(([k, v]) => (
              <div key={k} style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: v }} />
                <span style={{ color: v, fontSize: "10px", textTransform: "uppercase" }}>{k}</span>
              </div>
            ))}
          </div>

          {/* Live events */}
          <div style={{ flex: 1, padding: "12px", overflowY: "auto" }}>
            <div style={{ color: "rgba(0,255,136,0.5)", fontSize: "9px", letterSpacing: "1px", marginBottom: "8px" }}>
              LIVE EVENTS
            </div>
            {liveEvents.length === 0 && (
              <div style={{ color: "rgba(255,255,255,0.2)", fontSize: "10px" }}>
                {isRunning ? "Watching..." : "No events yet"}
              </div>
            )}
            {[...liveEvents].reverse().map(evt => (
              <div key={evt.id} style={{
                marginBottom: "6px",
                padding: "5px",
                background: "rgba(0,255,136,0.03)",
                borderLeft: `2px solid ${EVENT_COLORS[evt.type] ?? "#555"}`,
                borderRadius: "0 3px 3px 0",
              }}>
                <div style={{ color: EVENT_COLORS[evt.type] ?? "#aaa", fontSize: "8px", letterSpacing: "1px", marginBottom: "2px" }}>
                  {evt.type.toUpperCase()} · T{evt.tick}
                </div>
                <div style={{ color: "rgba(255,255,255,0.65)", fontSize: "9px", lineHeight: 1.4 }}>
                  {evt.description}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom — emergent narrative */}
      {isDone && simResult && (
        <div style={{
          padding: "14px 16px",
          borderTop: "1px solid rgba(0,255,136,0.1)",
          background: "rgba(0,255,136,0.03)",
        }}>
          <div style={{ color: "rgba(0,255,136,0.6)", fontSize: "9px", letterSpacing: "2px", marginBottom: "6px" }}>
            EMERGENT NARRATIVE
          </div>
          <div style={{ color: "rgba(255,255,255,0.85)", fontSize: "11px", lineHeight: 1.6, marginBottom: "10px" }}>
            {simResult.emergentNarrative}
          </div>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {simResult.recommendations.emergentMechanics.map(m => (
              <span key={m} style={{
                background: "rgba(0,255,136,0.08)",
                border: "1px solid rgba(0,255,136,0.2)",
                color: "#00ff88",
                fontSize: "9px",
                padding: "3px 8px",
                borderRadius: "3px",
                letterSpacing: "0.5px",
              }}>
                {m.replace(/_/g, " ")}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Progress bar */}
      {isRunning && (
        <div style={{ height: "2px", background: "rgba(0,255,136,0.1)" }}>
          <div style={{
            height: "100%",
            background: "#00ff88",
            width: `${(currentTick / totalTicks) * 100}%`,
            transition: "width 0.08s linear",
          }} />
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}
