// ============================================================
// ChatGameBuilder.tsx
// Conversational game spec builder — Replit/Emergent style
// Drop into src/sections/
// ============================================================

import { useState, useRef, useEffect, useCallback } from "react";
import type { GameSpec } from "@/types/game";

// ─── Types ───────────────────────────────────────────────────

interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
  specUpdate?: Partial<GameSpec>;
  isTyping?: boolean;
}

interface BuildState {
  phase: "greeting" | "collecting" | "confirming" | "generating" | "done";
  spec: Partial<GameSpec>;
  missingFields: string[];
}

// ─── Constants ───────────────────────────────────────────────

const FIELD_QUESTIONS: Record<string, string> = {
  title: "What's the name of your game?",
  genre: "What genre? (fps, rpg, platformer, survival, racing, puzzle)",
  setting: "What's the setting? (sci-fi, fantasy, modern, post-apocalyptic, historical)",
  style: "Visual style? (realistic, stylized, pixel, low-poly, cel-shaded)",
  target_platform: "Target platform? (pc, mobile, web, console)",
  complexity: "How complex? (simple, medium, complex)",
};

const GREETING = `SOVEREIGN GENESIS ENGINE v0.1
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

I'm the world architect. Tell me what you want to build — describe it however feels natural. I'll handle the translation.

Try something like:
  "a dark fantasy RPG set in a dying world"
  "fast-paced sci-fi shooter for mobile"
  "chill puzzle game with a modern aesthetic"

What are we building?`;

// ─── Parser — extract game spec from natural language ────────

function parseUserInput(input: string, currentSpec: Partial<GameSpec>): Partial<GameSpec> {
  const lower = input.toLowerCase();
  const updates: Partial<GameSpec> = {};

  // Genre detection
  if (lower.includes("fps") || lower.includes("shooter") || lower.includes("first person")) updates.genre = "fps";
  else if (lower.includes("rpg") || lower.includes("role playing") || lower.includes("role-playing")) updates.genre = "rpg";
  else if (lower.includes("platformer") || lower.includes("platform") || lower.includes("jump")) updates.genre = "platformer";
  else if (lower.includes("survival") || lower.includes("survive")) updates.genre = "survival";
  else if (lower.includes("racing") || lower.includes("race") || lower.includes("driving")) updates.genre = "racing";
  else if (lower.includes("puzzle") || lower.includes("logic")) updates.genre = "puzzle";

  // Setting detection
  if (lower.includes("sci-fi") || lower.includes("scifi") || lower.includes("space") || lower.includes("cyber") || lower.includes("futur")) updates.setting = "sci-fi";
  else if (lower.includes("fantasy") || lower.includes("magic") || lower.includes("dragon") || lower.includes("medieval")) updates.setting = "fantasy";
  else if (lower.includes("post-apoc") || lower.includes("wasteland") || lower.includes("nuclear") || lower.includes("apocal")) updates.setting = "post-apocalyptic";
  else if (lower.includes("histor") || lower.includes("ancient") || lower.includes("roman") || lower.includes("viking")) updates.setting = "historical";
  else if (lower.includes("modern") || lower.includes("contemporary") || lower.includes("urban") || lower.includes("city")) updates.setting = "modern";

  // Style detection
  if (lower.includes("pixel") || lower.includes("8-bit") || lower.includes("retro")) updates.style = "pixel";
  else if (lower.includes("low poly") || lower.includes("low-poly")) updates.style = "low-poly";
  else if (lower.includes("cel") || lower.includes("cartoon") || lower.includes("anime")) updates.style = "cel-shaded";
  else if (lower.includes("styliz") || lower.includes("stylish")) updates.style = "stylized";
  else if (lower.includes("realistic") || lower.includes("photorealistic")) updates.style = "realistic";

  // Platform detection
  if (lower.includes("mobile") || lower.includes("phone") || lower.includes("android") || lower.includes("ios")) updates.target_platform = "mobile";
  else if (lower.includes("web") || lower.includes("browser")) updates.target_platform = "web";
  else if (lower.includes("console") || lower.includes("playstation") || lower.includes("xbox")) updates.target_platform = "console";
  else if (lower.includes("pc") || lower.includes("desktop") || lower.includes("computer")) updates.target_platform = "pc";

  // Complexity detection
  if (lower.includes("simple") || lower.includes("quick") || lower.includes("easy") || lower.includes("small")) updates.complexity = "simple";
  else if (lower.includes("complex") || lower.includes("deep") || lower.includes("massive") || lower.includes("large")) updates.complexity = "complex";
  else if (lower.includes("medium") || lower.includes("mid") || lower.includes("moderate")) updates.complexity = "medium";

  // Title — look for quoted strings or "called X" / "named X"
  const quotedMatch = input.match(/["']([^"']+)["']/);
  const calledMatch = input.match(/(?:called|named|titled)\s+([A-Z][^\s,\.]+(?:\s+[A-Z][^\s,\.]+)*)/i);
  if (quotedMatch) updates.title = quotedMatch[1];
  else if (calledMatch) updates.title = calledMatch[1];

  return updates;
}

function getMissingFields(spec: Partial<GameSpec>): string[] {
  const required = ["genre", "setting", "style", "target_platform", "complexity"];
  return required.filter(f => !spec[f as keyof GameSpec]);
}

function buildConfirmationMessage(spec: Partial<GameSpec>): string {
  return `Here's what I'm building:

  TITLE       ${spec.title ?? "Untitled"}
  GENRE       ${spec.genre ?? "—"}
  SETTING     ${spec.setting ?? "—"}
  STYLE       ${spec.style ?? "—"}
  PLATFORM    ${spec.target_platform ?? "—"}
  COMPLEXITY  ${spec.complexity ?? "—"}

Type "build it" to run the simulation and generate your world.
Or tell me what to change.`;
}

function buildFollowUp(missing: string[], spec: Partial<GameSpec>): string {
  if (missing.length === 0) return buildConfirmationMessage(spec);

  const field = missing[0];
  const responses: Record<string, string> = {
    genre: `Got it. What genre? I support:
  fps · rpg · platformer · survival · racing · puzzle`,
    setting: `Nice. What's the world setting?
  sci-fi · fantasy · modern · post-apocalyptic · historical`,
    style: `Cool. Visual style?
  realistic · stylized · pixel · low-poly · cel-shaded`,
    target_platform: `Almost there. Target platform?
  pc · mobile · web · console`,
    complexity: `Last one — how deep does this go?
  simple (5-10min) · medium (15-30min) · complex (1-2hrs)`,
  };

  return responses[field] ?? `Tell me more about the ${field}.`;
}

// ─── Typewriter Hook ─────────────────────────────────────────

function useTypewriter(text: string, speed = 12, active = true) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!active) { setDisplayed(text); setDone(true); return; }
    setDisplayed("");
    setDone(false);
    let i = 0;
    const interval = setInterval(() => {
      if (i >= text.length) { clearInterval(interval); setDone(true); return; }
      setDisplayed(text.slice(0, i + 1));
      i++;
    }, speed);
    return () => clearInterval(interval);
  }, [text, active]);

  return { displayed, done };
}

// ─── Message Component ───────────────────────────────────────

function AssistantMessage({ content, isLatest }: { content: string; isLatest: boolean }) {
  const { displayed } = useTypewriter(content, 8, isLatest);

  return (
    <div style={{
      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
      fontSize: "13px",
      lineHeight: "1.7",
      color: "#e2e8f0",
      whiteSpace: "pre-wrap",
      wordBreak: "break-word",
    }}>
      <span style={{ color: "#00ff88", marginRight: "8px", opacity: 0.7 }}>▸</span>
      {displayed}
      {isLatest && displayed.length < content.length && (
        <span style={{
          display: "inline-block",
          width: "8px",
          height: "14px",
          background: "#00ff88",
          marginLeft: "2px",
          animation: "blink 1s infinite",
          verticalAlign: "text-bottom",
        }} />
      )}
    </div>
  );
}

function UserMessage({ content }: { content: string }) {
  return (
    <div style={{
      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
      fontSize: "13px",
      lineHeight: "1.7",
      color: "#94a3b8",
      whiteSpace: "pre-wrap",
      wordBreak: "break-word",
      paddingLeft: "16px",
      borderLeft: "2px solid rgba(148,163,184,0.2)",
    }}>
      {content}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────

interface ChatGameBuilderProps {
  onGenerate?: (spec: GameSpec) => void;
  onSpecUpdate?: (spec: Partial<GameSpec>) => void;
}

export default function ChatGameBuilder({ onGenerate, onSpecUpdate }: ChatGameBuilderProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "greeting",
      role: "assistant",
      content: GREETING,
      timestamp: Date.now(),
    }
  ]);
  const [input, setInput] = useState("");
  const [buildState, setBuildState] = useState<BuildState>({
    phase: "greeting",
    spec: { player_count: 1 },
    missingFields: Object.keys(FIELD_QUESTIONS),
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (onSpecUpdate) onSpecUpdate(buildState.spec);
  }, [buildState.spec]);

  const addMessage = useCallback((role: Message["role"], content: string, specUpdate?: Partial<GameSpec>) => {
    const msg: Message = {
      id: `msg_${Date.now()}_${Math.random()}`,
      role,
      content,
      timestamp: Date.now(),
      specUpdate,
    };
    setMessages(prev => [...prev, msg]);
    return msg;
  }, []);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || isProcessing) return;

    setInput("");
    setIsProcessing(true);

    // Add user message
    addMessage("user", text);

    // Small delay for feel
    await new Promise(r => setTimeout(r, 300));

    const lower = text.toLowerCase();

    // Check for build trigger
    if (lower.includes("build it") || lower.includes("generate") || lower.includes("let's go") || lower.includes("do it")) {
      const spec = buildState.spec;
      const missing = getMissingFields(spec);

      if (missing.length > 0) {
        addMessage("assistant", `Not quite ready — still need:\n${missing.map(f => `  · ${f}`).join("\n")}\n\n${buildFollowUp(missing, spec)}`);
      } else {
        addMessage("assistant", `Running simulation layer...\n\nSpawning agents. Watching your world tear itself apart before we build it.\n\nStand by.`);
        setBuildState(prev => ({ ...prev, phase: "generating" }));

        await new Promise(r => setTimeout(r, 1500));

        const fullSpec: GameSpec = {
          title: spec.title ?? "Untitled World",
          genre: spec.genre ?? "rpg",
          setting: spec.setting ?? "sci-fi",
          style: spec.style ?? "stylized",
          target_platform: spec.target_platform ?? "pc",
          complexity: spec.complexity ?? "medium",
          player_count: 1,
        };

        addMessage("assistant", `Simulation complete.\n\nWorld state crystallized. Narrative threads extracted. Generating your game package now.`);
        setBuildState(prev => ({ ...prev, phase: "done" }));

        if (onGenerate) onGenerate(fullSpec);
      }
      setIsProcessing(false);
      return;
    }

    // Check for reset
    if (lower.includes("start over") || lower.includes("reset") || lower.includes("restart")) {
      setBuildState({ phase: "greeting", spec: { player_count: 1 }, missingFields: Object.keys(FIELD_QUESTIONS) });
      addMessage("assistant", "World reset. Starting fresh.\n\nWhat are we building?");
      setIsProcessing(false);
      return;
    }

    // Parse input for spec fields
    const updates = parseUserInput(text, buildState.spec);
    const newSpec = { ...buildState.spec, ...updates };
    const missing = getMissingFields(newSpec);

    setBuildState(prev => ({
      ...prev,
      phase: missing.length === 0 ? "confirming" : "collecting",
      spec: newSpec,
      missingFields: missing,
    }));

    // Generate response
    let response = "";
    if (Object.keys(updates).length === 0) {
      // Nothing parsed — ask more directly
      response = buildFollowUp(missing, newSpec);
    } else if (missing.length === 0) {
      response = buildConfirmationMessage(newSpec);
    } else {
      // Acknowledge what we got, ask for next
      const gotFields = Object.keys(updates).join(", ");
      response = `Got ${gotFields}.\n\n${buildFollowUp(missing, newSpec)}`;
    }

    addMessage("assistant", response, updates);
    setIsProcessing(false);
  }, [input, isProcessing, buildState, addMessage, onGenerate]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const quickPrompts = [
    "cyberpunk RPG for PC",
    "mobile survival game",
    "sci-fi FPS, complex",
    "fantasy platformer, pixel style",
  ];

  return (
    <section style={{
      background: "#050a0f",
      minHeight: "100vh",
      padding: "80px 24px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
    }}>
      <style>{`
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .msg-appear { animation: fadeIn 0.3s ease forwards; }
        .chat-input:focus { outline: none; border-color: rgba(0,255,136,0.4) !important; }
        .quick-btn:hover { background: rgba(0,255,136,0.15) !important; border-color: rgba(0,255,136,0.4) !important; }
        .send-btn:hover { background: rgba(0,255,136,0.3) !important; }
        .send-btn:disabled { opacity: 0.3; cursor: not-allowed; }
      `}</style>

      {/* Header */}
      <div style={{ width: "100%", maxWidth: "760px", marginBottom: "32px" }}>
        <div style={{
          fontFamily: "monospace",
          fontSize: "10px",
          letterSpacing: "3px",
          color: "rgba(0,255,136,0.5)",
          marginBottom: "8px",
          textTransform: "uppercase",
        }}>
          World Architect Interface
        </div>
        <h2 style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: "clamp(20px, 3vw, 28px)",
          fontWeight: "700",
          color: "#f1f5f9",
          margin: 0,
          lineHeight: 1.2,
        }}>
          Build your world.<br />
          <span style={{ color: "#00ff88" }}>Describe it. We simulate it.</span>
        </h2>
      </div>

      {/* Chat window */}
      <div style={{
        width: "100%",
        maxWidth: "760px",
        background: "rgba(0,0,0,0.6)",
        border: "1px solid rgba(0,255,136,0.12)",
        borderRadius: "8px",
        overflow: "hidden",
        backdropFilter: "blur(20px)",
      }}>
        {/* Terminal chrome */}
        <div style={{
          padding: "10px 16px",
          borderBottom: "1px solid rgba(0,255,136,0.08)",
          display: "flex",
          alignItems: "center",
          gap: "6px",
          background: "rgba(0,255,136,0.03)",
        }}>
          <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#ff5f57" }} />
          <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#ffbd2e" }} />
          <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#28ca41" }} />
          <span style={{
            marginLeft: "8px",
            fontFamily: "monospace",
            fontSize: "11px",
            color: "rgba(0,255,136,0.4)",
            letterSpacing: "1px",
          }}>
            sovereign-genesis ~ world-architect
          </span>
          {buildState.phase === "generating" && (
            <span style={{
              marginLeft: "auto",
              fontFamily: "monospace",
              fontSize: "10px",
              color: "#ffbd2e",
              letterSpacing: "1px",
            }}>
              ● SIMULATING
            </span>
          )}
          {buildState.phase === "done" && (
            <span style={{
              marginLeft: "auto",
              fontFamily: "monospace",
              fontSize: "10px",
              color: "#28ca41",
              letterSpacing: "1px",
            }}>
              ✓ GENERATED
            </span>
          )}
        </div>

        {/* Messages */}
        <div style={{
          height: "420px",
          overflowY: "auto",
          padding: "24px",
          display: "flex",
          flexDirection: "column",
          gap: "20px",
        }}>
          {messages.map((msg, i) => (
            <div key={msg.id} className="msg-appear">
              {msg.role === "assistant" ? (
                <AssistantMessage
                  content={msg.content}
                  isLatest={i === messages.length - 1}
                />
              ) : (
                <UserMessage content={msg.content} />
              )}
            </div>
          ))}
          {isProcessing && (
            <div style={{ display: "flex", gap: "4px", paddingLeft: "16px" }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  background: "#00ff88",
                  opacity: 0.5,
                  animation: `blink 1s infinite ${i * 0.2}s`,
                }} />
              ))}
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Quick prompts */}
        {buildState.phase === "greeting" && (
          <div style={{
            padding: "0 24px 12px",
            display: "flex",
            gap: "8px",
            flexWrap: "wrap",
          }}>
            {quickPrompts.map(p => (
              <button
                key={p}
                className="quick-btn"
                onClick={() => { setInput(p); inputRef.current?.focus(); }}
                style={{
                  background: "rgba(0,255,136,0.06)",
                  border: "1px solid rgba(0,255,136,0.2)",
                  color: "rgba(0,255,136,0.8)",
                  padding: "4px 10px",
                  borderRadius: "4px",
                  fontSize: "11px",
                  fontFamily: "monospace",
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                {p}
              </button>
            ))}
          </div>
        )}

        {/* Spec preview bar */}
        {Object.keys(buildState.spec).filter(k => k !== "player_count").length > 0 && (
          <div style={{
            padding: "8px 24px",
            borderTop: "1px solid rgba(0,255,136,0.06)",
            display: "flex",
            gap: "12px",
            flexWrap: "wrap",
          }}>
            {(["genre", "setting", "style", "target_platform", "complexity"] as const).map(field => (
              buildState.spec[field] ? (
                <span key={field} style={{
                  fontFamily: "monospace",
                  fontSize: "10px",
                  color: "#00ff88",
                  background: "rgba(0,255,136,0.08)",
                  padding: "2px 8px",
                  borderRadius: "3px",
                  border: "1px solid rgba(0,255,136,0.2)",
                }}>
                  {field}: {buildState.spec[field]}
                </span>
              ) : (
                <span key={field} style={{
                  fontFamily: "monospace",
                  fontSize: "10px",
                  color: "rgba(255,255,255,0.15)",
                  padding: "2px 8px",
                }}>
                  {field}: ?
                </span>
              )
            ))}
          </div>
        )}

        {/* Input */}
        <div style={{
          padding: "16px 24px",
          borderTop: "1px solid rgba(0,255,136,0.08)",
          display: "flex",
          gap: "10px",
          alignItems: "flex-end",
        }}>
          <textarea
            ref={inputRef}
            className="chat-input"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={buildState.phase === "done" ? "Type 'start over' to build another..." : "Describe your game or answer the question above..."}
            rows={1}
            style={{
              flex: 1,
              background: "rgba(0,255,136,0.04)",
              border: "1px solid rgba(0,255,136,0.15)",
              borderRadius: "6px",
              color: "#e2e8f0",
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "13px",
              padding: "10px 14px",
              resize: "none",
              lineHeight: "1.5",
              minHeight: "42px",
              maxHeight: "120px",
              transition: "border-color 0.15s",
            }}
          />
          <button
            className="send-btn"
            onClick={handleSend}
            disabled={isProcessing || !input.trim()}
            style={{
              background: "rgba(0,255,136,0.15)",
              border: "1px solid rgba(0,255,136,0.3)",
              color: "#00ff88",
              width: "42px",
              height: "42px",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.15s",
              flexShrink: 0,
            }}
          >
            ↵
          </button>
        </div>
      </div>

      {/* Hint */}
      <div style={{
        marginTop: "16px",
        fontFamily: "monospace",
        fontSize: "11px",
        color: "rgba(255,255,255,0.2)",
        textAlign: "center",
      }}>
        Press Enter to send · Shift+Enter for new line · Type "build it" when ready
      </div>
    </section>
  );
}
