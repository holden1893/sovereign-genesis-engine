// ============================================================
// LivePreview.tsx
// Real-time game package preview — renders output as it generates
// Drop into src/sections/
// ============================================================

import { useState, useEffect, useRef } from "react";
import type { GamePackage, GameSpec } from "@/types/game";

// ─── Types ───────────────────────────────────────────────────

interface LivePreviewProps {
  gamePackage?: GamePackage | null;
  isGenerating?: boolean;
  _spec?: Partial<GameSpec> | null;
}

interface Tab {
  id: string;
  label: string;
  icon: string;
}

// ─── Constants ───────────────────────────────────────────────

const TABS: Tab[] = [
  { id: "narrative", label: "Narrative", icon: "◈" },
  { id: "design", label: "Design", icon: "⬡" },
  { id: "assets", label: "Assets", icon: "◆" },
  { id: "code", label: "Code", icon: "⌨" },
  { id: "export", label: "Export", icon: "↗" },
];

// ─── Skeleton loader ─────────────────────────────────────────

function Skeleton({ width = "100%", height = "14px", style = {} }: { width?: string; height?: string; style?: React.CSSProperties }) {
  return (
    <div style={{
      width,
      height,
      background: "linear-gradient(90deg, rgba(0,255,136,0.04) 25%, rgba(0,255,136,0.1) 50%, rgba(0,255,136,0.04) 75%)",
      backgroundSize: "200% 100%",
      borderRadius: "3px",
      animation: "shimmer 1.5s infinite",
      ...style,
    }} />
  );
}

// ─── Stat card ───────────────────────────────────────────────

function StatCard({ label, value, accent = false }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <div style={{
      padding: "12px 16px",
      background: accent ? "rgba(0,255,136,0.08)" : "rgba(255,255,255,0.03)",
      border: `1px solid ${accent ? "rgba(0,255,136,0.2)" : "rgba(255,255,255,0.06)"}`,
      borderRadius: "6px",
    }}>
      <div style={{ fontSize: "9px", fontFamily: "monospace", letterSpacing: "1px", color: "rgba(255,255,255,0.35)", marginBottom: "4px", textTransform: "uppercase" }}>
        {label}
      </div>
      <div style={{ fontSize: "16px", fontFamily: "monospace", fontWeight: "700", color: accent ? "#00ff88" : "#f1f5f9" }}>
        {value}
      </div>
    </div>
  );
}

// ─── Tag ─────────────────────────────────────────────────────

function Tag({ text, color = "#00ff88" }: { text: string; color?: string }) {
  return (
    <span style={{
      display: "inline-block",
      padding: "3px 10px",
      background: `${color}14`,
      border: `1px solid ${color}33`,
      borderRadius: "3px",
      fontFamily: "monospace",
      fontSize: "10px",
      color,
      letterSpacing: "0.5px",
      margin: "2px",
    }}>
      {text.replace(/_/g, " ")}
    </span>
  );
}

// ─── Section header ──────────────────────────────────────────

function SectionHeader({ title }: { title: string }) {
  return (
    <div style={{
      fontFamily: "monospace",
      fontSize: "9px",
      letterSpacing: "2px",
      color: "rgba(0,255,136,0.5)",
      textTransform: "uppercase",
      marginBottom: "10px",
      marginTop: "20px",
      paddingBottom: "6px",
      borderBottom: "1px solid rgba(0,255,136,0.08)",
    }}>
      {title}
    </div>
  );
}

// ─── Tab content panels ──────────────────────────────────────

function NarrativePanel({ game, loading }: { game?: GamePackage; loading?: boolean }) {
  if (loading) return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      <Skeleton height="20px" width="60%" />
      <Skeleton height="14px" />
      <Skeleton height="14px" width="85%" />
      <Skeleton height="14px" width="90%" />
      <Skeleton height="14px" width="70%" />
    </div>
  );

  if (!game) return (
    <div style={{ color: "rgba(255,255,255,0.2)", fontFamily: "monospace", fontSize: "12px", textAlign: "center", padding: "40px 0" }}>
      No world generated yet.<br />Build something.
    </div>
  );

  const sim = (game.spec as any).simulationData;

  return (
    <div>
      <SectionHeader title="World Title" />
      <div style={{ fontFamily: "monospace", fontSize: "20px", fontWeight: "700", color: "#f1f5f9", marginBottom: "4px" }}>
        {game.spec.title}
      </div>
      <div style={{ fontFamily: "monospace", fontSize: "11px", color: "rgba(0,255,136,0.6)" }}>
        {game.spec.genre} · {game.spec.setting} · {game.spec.complexity}
      </div>

      {sim?.emergentNarrative && (
        <>
          <SectionHeader title="Emergent Narrative" />
          <div style={{
            fontFamily: "Georgia, serif",
            fontSize: "13px",
            lineHeight: "1.8",
            color: "#cbd5e1",
            padding: "16px",
            background: "rgba(0,255,136,0.03)",
            border: "1px solid rgba(0,255,136,0.08)",
            borderRadius: "6px",
            borderLeft: "3px solid rgba(0,255,136,0.3)",
          }}>
            {sim.emergentNarrative}
          </div>
        </>
      )}

      {game.design.narrative_outline && (
        <>
          <SectionHeader title="Story Outline" />
          <div style={{
            fontFamily: "Georgia, serif",
            fontSize: "13px",
            lineHeight: "1.8",
            color: "#cbd5e1",
          }}>
            {game.design.narrative_outline}
          </div>
        </>
      )}

      <SectionHeader title="Core Mechanics" />
      <div style={{ display: "flex", flexWrap: "wrap" }}>
        {game.design.core_mechanics.map(m => <Tag key={m} text={m} />)}
      </div>

      <SectionHeader title="Key Features" />
      <div style={{ display: "flex", flexWrap: "wrap" }}>
        {game.design.key_features.map(f => <Tag key={f} text={f} color="#4488ff" />)}
      </div>

      {sim?.recommendations?.narrativeHooks && (
        <>
          <SectionHeader title="Narrative Hooks" />
          {sim.recommendations.narrativeHooks.map((hook: string, i: number) => (
            <div key={i} style={{
              padding: "10px 14px",
              marginBottom: "8px",
              background: "rgba(255,170,0,0.05)",
              border: "1px solid rgba(255,170,0,0.15)",
              borderRadius: "4px",
              fontFamily: "monospace",
              fontSize: "11px",
              color: "#fbbf24",
              lineHeight: "1.6",
            }}>
              ⚡ {hook}
            </div>
          ))}
        </>
      )}
    </div>
  );
}

function DesignPanel({ game, loading }: { game?: GamePackage; loading?: boolean }) {
  if (loading) return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
      {Array(6).fill(0).map((_, i) => <Skeleton key={i} height="60px" />)}
    </div>
  );

  if (!game) return (
    <div style={{ color: "rgba(255,255,255,0.2)", fontFamily: "monospace", fontSize: "12px", textAlign: "center", padding: "40px 0" }}>
      Awaiting world data.
    </div>
  );

  const sim = (game.spec as any).simulationData;
  const ls = game.design.level_structure;

  return (
    <div>
      <SectionHeader title="World Stats" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: "8px", marginBottom: "16px" }}>
        <StatCard label="Rooms" value={ls?.rooms ?? "—"} accent />
        <StatCard label="Connections" value={ls?.connections ?? "—"} />
        <StatCard label="World Size" value={ls?.size ?? "—"} />
        <StatCard label="Playtime" value={ls?.estimated_playtime ?? "—"} />
        {sim && <StatCard label="Agent Count" value={sim.agentCount ?? "—"} accent />}
        {sim && <StatCard label="Survivors" value={sim.survivorCount ?? "—"} />}
      </div>

      {sim && (
        <>
          <SectionHeader title="Simulation Insights" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "16px" }}>
            <StatCard label="Dominant Faction" value={sim.dominantFaction ?? "—"} accent />
            <StatCard label="Conflict Zone" value={sim.worldState?.mostContestedZone ?? "—"} />
            <StatCard label="Safe Start Zone" value={sim.worldState?.mostPeacefulZone ?? "—"} />
            <StatCard label="Survivor Rate" value={sim.survivorCount ? `${Math.round((sim.survivorCount / sim.agentCount) * 100)}%` : "—"} />
          </div>

          {sim.recommendations?.emergentMechanics?.length > 0 && (
            <>
              <SectionHeader title="Emergent Mechanics" />
              <div style={{ display: "flex", flexWrap: "wrap" }}>
                {sim.recommendations.emergentMechanics.map((m: string) => (
                  <Tag key={m} text={m} color="#ff6600" />
                ))}
              </div>
            </>
          )}
        </>
      )}

      <SectionHeader title="Art Direction" />
      <div style={{
        padding: "12px 16px",
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: "6px",
        fontFamily: "monospace",
        fontSize: "12px",
        color: "#94a3b8",
        lineHeight: "1.6",
      }}>
        {game.design.art_direction}
      </div>

      <SectionHeader title="Character Roster" />
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        {game.design.character_roles?.map((c, i) => (
          <div key={i} style={{
            display: "flex",
            justifyContent: "space-between",
            padding: "8px 12px",
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.04)",
            borderRadius: "4px",
            fontFamily: "monospace",
            fontSize: "11px",
          }}>
            <span style={{ color: "#f1f5f9" }}>{c.role}</span>
            <span style={{ color: "#64748b" }}>{c.type}</span>
            <span style={{ color: c.importance === "primary" ? "#00ff88" : "#64748b" }}>{c.importance}</span>
            {c.count && <span style={{ color: "#4488ff" }}>×{c.count}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

function AssetsPanel({ game, loading }: { game?: GamePackage; loading?: boolean }) {
  if (loading) return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      {Array(8).fill(0).map((_, i) => <Skeleton key={i} height="44px" />)}
    </div>
  );

  if (!game) return (
    <div style={{ color: "rgba(255,255,255,0.2)", fontFamily: "monospace", fontSize: "12px", textAlign: "center", padding: "40px 0" }}>
      No assets generated yet.
    </div>
  );

  const typeColors: Record<string, string> = {
    character: "#00ff88",
    enemy: "#ff3366",
    prop: "#4488ff",
    weapon: "#ffaa00",
  };

  return (
    <div>
      <SectionHeader title={`Asset Manifest (${game.assets.length} objects)`} />
      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
        {game.assets.map((asset, i) => (
          <div key={i} style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "8px 12px",
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.04)",
            borderRadius: "4px",
            fontFamily: "monospace",
            fontSize: "11px",
          }}>
            <span style={{
              width: "60px",
              color: typeColors[asset.asset_type] ?? "#94a3b8",
              fontSize: "9px",
              letterSpacing: "1px",
              textTransform: "uppercase",
              flexShrink: 0,
            }}>
              {asset.asset_type}
            </span>
            <span style={{ color: "#f1f5f9", flex: 1 }}>{asset.name}</span>
            <span style={{ color: "#475569", fontSize: "10px" }}>{asset.vertex_count}v</span>
            <span style={{ color: "#475569", fontSize: "10px" }}>{asset.face_count}f</span>
            {asset.has_animations && <span style={{ color: "#00ff88", fontSize: "9px" }}>ANIM</span>}
            {asset.has_texture && <span style={{ color: "#4488ff", fontSize: "9px" }}>TEX</span>}
          </div>
        ))}
      </div>

      <SectionHeader title="Scenes" />
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        {game.scenes.map((scene, i) => (
          <div key={i} style={{
            padding: "12px 16px",
            background: "rgba(0,255,136,0.03)",
            border: "1px solid rgba(0,255,136,0.08)",
            borderRadius: "6px",
          }}>
            <div style={{ fontFamily: "monospace", fontSize: "12px", color: "#00ff88", marginBottom: "6px" }}>{scene.name}</div>
            <div style={{ display: "flex", gap: "16px" }}>
              <span style={{ fontFamily: "monospace", fontSize: "10px", color: "#64748b" }}>
                {scene.asset_count} assets
              </span>
              <span style={{ fontFamily: "monospace", fontSize: "10px", color: "#64748b" }}>
                cam: {scene.camera?.type ?? "—"}
              </span>
              <span style={{ fontFamily: "monospace", fontSize: "10px", color: "#64748b" }}>
                {scene.spawn_points?.length ?? 0} spawns
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CodePanel({ game, loading }: { game?: GamePackage; loading?: boolean }) {
  if (loading) return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      <Skeleton height="200px" />
    </div>
  );

  if (!game) return (
    <div style={{ color: "rgba(255,255,255,0.2)", fontFamily: "monospace", fontSize: "12px", textAlign: "center", padding: "40px 0" }}>
      No code generated yet.
    </div>
  );

  const pc = game.code.player_controller;
  const ai = game.code.enemy_ai;

  return (
    <div>
      <SectionHeader title="Player Controller" />
      <pre style={{
        background: "rgba(0,0,0,0.4)",
        border: "1px solid rgba(0,255,136,0.08)",
        borderRadius: "6px",
        padding: "16px",
        fontFamily: "monospace",
        fontSize: "11px",
        color: "#94a3b8",
        overflow: "auto",
        lineHeight: "1.6",
        margin: 0,
      }}>
        {JSON.stringify(pc, null, 2)}
      </pre>

      <SectionHeader title="Enemy AI Config" />
      <pre style={{
        background: "rgba(0,0,0,0.4)",
        border: "1px solid rgba(0,255,136,0.08)",
        borderRadius: "6px",
        padding: "16px",
        fontFamily: "monospace",
        fontSize: "11px",
        color: "#94a3b8",
        overflow: "auto",
        lineHeight: "1.6",
        margin: 0,
      }}>
        {JSON.stringify(ai, null, 2)}
      </pre>

      <SectionHeader title="HUD Elements" />
      <div style={{ display: "flex", flexWrap: "wrap" }}>
        {game.code.ui_system?.hud_elements?.map((h: string) => <Tag key={h} text={h} color="#cc88ff" />)}
      </div>
    </div>
  );
}

function ExportPanel({ game, loading }: { game?: GamePackage; loading?: boolean }) {
  const [copied, setCopied] = useState(false);

  const copyId = () => {
    if (!game) return;
    navigator.clipboard.writeText(game.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      {Array(4).fill(0).map((_, i) => <Skeleton key={i} height="50px" />)}
    </div>
  );

  if (!game) return (
    <div style={{ color: "rgba(255,255,255,0.2)", fontFamily: "monospace", fontSize: "12px", textAlign: "center", padding: "40px 0" }}>
      Generate a world to export it.
    </div>
  );

  const ec = game.export_config;

  return (
    <div>
      <SectionHeader title="Package ID" />
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "10px 14px",
        background: "rgba(0,0,0,0.4)",
        border: "1px solid rgba(0,255,136,0.1)",
        borderRadius: "6px",
        fontFamily: "monospace",
        fontSize: "12px",
        color: "#00ff88",
      }}>
        <span style={{ flex: 1 }}>{game.id}</span>
        <button
          onClick={copyId}
          style={{
            background: "rgba(0,255,136,0.1)",
            border: "1px solid rgba(0,255,136,0.2)",
            color: "#00ff88",
            padding: "4px 10px",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "10px",
            fontFamily: "monospace",
          }}
        >
          {copied ? "✓ COPIED" : "COPY"}
        </button>
      </div>

      <SectionHeader title="Build Config" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
        <StatCard label="Platform" value={ec.platform} accent />
        <StatCard label="Format" value={ec.format} />
        <StatCard label="Engine" value={ec.engine} />
        <StatCard label="Generated" value={new Date(game.generated_at).toLocaleTimeString()} />
      </div>

      <SectionHeader title="File Structure" />
      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
        {Object.entries(ec.file_structure).map(([path, desc]) => (
          <div key={path} style={{
            display: "flex",
            gap: "12px",
            padding: "6px 12px",
            fontFamily: "monospace",
            fontSize: "11px",
          }}>
            <span style={{ color: "#4488ff", width: "100px", flexShrink: 0 }}>{path}</span>
            <span style={{ color: "#475569" }}>{desc as string}</span>
          </div>
        ))}
      </div>

      <SectionHeader title="Dependencies" />
      <div style={{ display: "flex", flexWrap: "wrap" }}>
        {ec.dependencies.map((d: string) => <Tag key={d} text={d} color="#94a3b8" />)}
      </div>

      <div style={{ marginTop: "20px" }}>
        <a
          href={`/api/games/${game.id}/download`}
          style={{
            display: "block",
            textAlign: "center",
            padding: "12px",
            background: "rgba(0,255,136,0.15)",
            border: "1px solid rgba(0,255,136,0.3)",
            borderRadius: "6px",
            color: "#00ff88",
            fontFamily: "monospace",
            fontSize: "12px",
            textDecoration: "none",
            letterSpacing: "1px",
          }}
        >
          ↓ DOWNLOAD GAME PACKAGE
        </a>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────

export default function LivePreview({ gamePackage, isGenerating }: LivePreviewProps) {
  const [activeTab, setActiveTab] = useState("narrative");
  const prevGame = useRef<GamePackage | null>(null);

  useEffect(() => {
    if (gamePackage) {
      prevGame.current = gamePackage;
      setActiveTab("narrative");
    }
  }, [gamePackage]);

  const game = gamePackage ?? prevGame.current ?? undefined;
  const loading = isGenerating && !gamePackage;

  return (
    <section style={{
      background: "#050a0f",
      padding: "80px 24px",
      minHeight: "600px",
    }}>
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .tab-btn:hover { background: rgba(0,255,136,0.08) !important; }
      `}</style>

      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: "32px" }}>
          <div style={{
            fontFamily: "monospace",
            fontSize: "10px",
            letterSpacing: "3px",
            color: "rgba(0,255,136,0.5)",
            marginBottom: "8px",
          }}>
            LIVE PREVIEW
          </div>
          <h2 style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "clamp(20px, 3vw, 28px)",
            fontWeight: "700",
            color: "#f1f5f9",
            margin: 0,
          }}>
            {loading ? "Generating world..." : game ? game.spec.title : "World output appears here"}
          </h2>
          {isGenerating && (
            <div style={{
              marginTop: "8px",
              fontFamily: "monospace",
              fontSize: "11px",
              color: "#ffbd2e",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}>
              <div style={{
                width: "6px", height: "6px", borderRadius: "50%",
                background: "#ffbd2e",
                animation: "shimmer 1s infinite",
              }} />
              Simulation running · Agents deployed · Narrative crystallizing...
            </div>
          )}
        </div>

        {/* Main panel */}
        <div style={{
          background: "rgba(0,0,0,0.5)",
          border: "1px solid rgba(0,255,136,0.1)",
          borderRadius: "8px",
          overflow: "hidden",
        }}>
          {/* Tabs */}
          <div style={{
            display: "flex",
            borderBottom: "1px solid rgba(0,255,136,0.08)",
            background: "rgba(0,255,136,0.02)",
            overflowX: "auto",
          }}>
            {TABS.map(tab => (
              <button
                key={tab.id}
                className="tab-btn"
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: "12px 20px",
                  background: activeTab === tab.id ? "rgba(0,255,136,0.1)" : "transparent",
                  border: "none",
                  borderBottom: activeTab === tab.id ? "2px solid #00ff88" : "2px solid transparent",
                  color: activeTab === tab.id ? "#00ff88" : "rgba(255,255,255,0.4)",
                  fontFamily: "monospace",
                  fontSize: "11px",
                  letterSpacing: "1px",
                  cursor: "pointer",
                  transition: "all 0.15s",
                  whiteSpace: "nowrap",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <span>{tab.icon}</span>
                <span>{tab.label.toUpperCase()}</span>
              </button>
            ))}
          </div>

          {/* Content */}
          <div style={{
            padding: "24px",
            minHeight: "400px",
            maxHeight: "600px",
            overflowY: "auto",
          }}>
            {activeTab === "narrative" && <NarrativePanel game={game} loading={loading} />}
            {activeTab === "design" && <DesignPanel game={game} loading={loading} />}
            {activeTab === "assets" && <AssetsPanel game={game} loading={loading} />}
            {activeTab === "code" && <CodePanel game={game} loading={loading} />}
            {activeTab === "export" && <ExportPanel game={game} loading={loading} />}
          </div>
        </div>

        {/* Empty state hint */}
        {!game && !loading && (
          <div style={{
            textAlign: "center",
            marginTop: "24px",
            fontFamily: "monospace",
            fontSize: "11px",
            color: "rgba(255,255,255,0.15)",
          }}>
            Use the World Architect above to generate your first world
          </div>
        )}
      </div>
    </section>
  );
}
