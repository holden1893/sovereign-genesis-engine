// ============================================================
// SOVEREIGN GENESIS ENGINE — Simulation Core
// src/lib/simulationEngine.ts
//
// "Simulate first. Generate second. Never guess again."
//
// This is the narrative prediction layer. Feed it a GameSpec,
// it spawns N synthetic agents, runs them through the world,
// and watches what emerges. The output enriches your game
// package with REAL emergent narrative data — not templates.
// ============================================================

import type { GameSpec } from '@/types/game';

// ─────────────────────────────────────────────
// CORE TYPES
// ─────────────────────────────────────────────

export type AgentRole = 'hero' | 'villain' | 'neutral' | 'merchant' | 'guardian' | 'wanderer';
export type AgentState = 'idle' | 'exploring' | 'pursuing' | 'fleeing' | 'trading' | 'resting' | 'dead';
export type NarrativeArcType = 'rise' | 'fall' | 'redemption' | 'tragedy' | 'discovery' | 'conflict';
export type FactionAlignment = 'order' | 'chaos' | 'neutral';

export interface AgentMemory {
  visitedZones: string[];
  encounteredAgents: string[];
  acquiredItems: string[];
  completedObjectives: string[];
  failedObjectives: string[];
}

export interface Agent {
  id: string;
  name: string;
  role: AgentRole;
  state: AgentState;
  alignment: FactionAlignment;
  health: number;
  maxHealth: number;
  energy: number;
  position: { x: number; y: number; zone: string };
  stats: {
    strength: number;
    agility: number;
    intelligence: number;
    charisma: number;
  };
  inventory: string[];
  memory: AgentMemory;
  tick: number;           // age in simulation steps
  narrativeWeight: number; // how much this agent influences story
  alive: boolean;
}

export interface WorldZone {
  id: string;
  name: string;
  type: 'safe' | 'contested' | 'hostile' | 'neutral' | 'sacred';
  resourceDensity: number;   // 0–1
  dangerLevel: number;       // 0–1
  connectedZones: string[];
  currentAgents: string[];   // agent IDs
  events: SimEvent[];
  controlledBy?: string;     // faction or agent ID
}

export interface WorldState {
  tick: number;
  zones: Map<string, WorldZone>;
  agents: Map<string, Agent>;
  globalEvents: SimEvent[];
  factionControl: Map<FactionAlignment, number>; // % world control
  narrativeThreads: NarrativeThread[];
}

export interface SimEvent {
  id: string;
  tick: number;
  type: 'combat' | 'trade' | 'discovery' | 'death' | 'alliance' | 'betrayal' | 'quest_complete' | 'faction_shift';
  actorIds: string[];
  zoneId: string;
  description: string;
  narrativeImpact: number; // 0–1, how story-significant is this
}

export interface NarrativeThread {
  id: string;
  arc: NarrativeArcType;
  protagonistId: string;
  antagonistId?: string;
  tension: number;          // 0–1, current dramatic tension
  resolution?: string;      // null until resolved
  keyEvents: string[];      // event IDs
  predictedOutcome: string;
}

export interface SimulationResult {
  totalTicks: number;
  agentCount: number;
  survivorCount: number;
  dominantFaction: FactionAlignment;
  emergentNarrative: string;
  narrativeThreads: NarrativeThread[];
  keyEvents: SimEvent[];
  worldState: {
    mostContestedZone: string;
    mostPeacefulZone: string;
    powerVacuums: string[];
    tradeHubs: string[];
  };
  recommendations: {
    suggestedProtagonistRole: AgentRole;
    suggestedAntagonistRole: AgentRole;
    recommendedStartZone: string;
    emergentMechanics: string[];
    narrativeHooks: string[];
  };
  rawEvents: SimEvent[];
  agentHistories: Map<string, SimEvent[]>;
}

export interface SimulationConfig {
  agentCount: number;
  maxTicks: number;
  worldSize: 'small' | 'medium' | 'large';
  conflictFrequency: number;  // 0–1
  tradeFrequency: number;     // 0–1
  seed?: number;
}

// ─────────────────────────────────────────────
// SEEDED RANDOM (reproducible simulations)
// ─────────────────────────────────────────────

class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  next(): number {
    this.seed = (this.seed * 1664525 + 1013904223) & 0xffffffff;
    return ((this.seed >>> 0) / 0xffffffff);
  }

  between(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  pick<T>(arr: T[]): T {
    return arr[Math.floor(this.next() * arr.length)];
  }

  chance(probability: number): boolean {
    return this.next() < probability;
  }
}

// ─────────────────────────────────────────────
// WORLD BUILDER
// ─────────────────────────────────────────────

function buildWorld(spec: GameSpec, config: SimulationConfig, rng: SeededRandom): Map<string, WorldZone> {
  const zones = new Map<string, WorldZone>();

  const zoneTemplates = getZoneTemplates(spec.setting, spec.genre);
  const zoneCount = config.worldSize === 'small' ? 5 : config.worldSize === 'medium' ? 9 : 15;

  for (let i = 0; i < zoneCount; i++) {
    const template = zoneTemplates[i % zoneTemplates.length];
    const zone: WorldZone = {
      id: `zone_${i}`,
      name: `${template.name} ${i > zoneTemplates.length - 1 ? `(${i})` : ''}`.trim(),
      type: template.type,
      resourceDensity: rng.between(0.2, 1.0),
      dangerLevel: template.type === 'hostile' ? rng.between(0.6, 1.0)
                 : template.type === 'safe' ? rng.between(0.0, 0.2)
                 : rng.between(0.3, 0.7),
      connectedZones: [],
      currentAgents: [],
      events: [],
    };
    zones.set(zone.id, zone);
  }

  // Wire zone connections (graph)
  const zoneIds = Array.from(zones.keys());
  for (let i = 0; i < zoneIds.length; i++) {
    const zone = zones.get(zoneIds[i])!;
    const connections = Math.floor(rng.between(1, 3));
    for (let c = 0; c < connections; c++) {
      const target = zoneIds[Math.floor(rng.between(0, zoneIds.length))];
      if (target !== zoneIds[i] && !zone.connectedZones.includes(target)) {
        zone.connectedZones.push(target);
        zones.get(target)!.connectedZones.push(zoneIds[i]);
      }
    }
    // Guarantee at least one connection
    if (zone.connectedZones.length === 0) {
      const fallback = zoneIds[(i + 1) % zoneIds.length];
      zone.connectedZones.push(fallback);
      zones.get(fallback)!.connectedZones.push(zoneIds[i]);
    }
  }

  return zones;
}

// ─────────────────────────────────────────────
// AGENT SPAWNER
// ─────────────────────────────────────────────

function spawnAgents(spec: GameSpec, config: SimulationConfig, world: Map<string, WorldZone>, rng: SeededRandom): Map<string, Agent> {
  const agents = new Map<string, Agent>();
  const zoneIds = Array.from(world.keys());
  const roles: AgentRole[] = ['hero', 'villain', 'neutral', 'merchant', 'guardian', 'wanderer'];
  const alignments: FactionAlignment[] = ['order', 'chaos', 'neutral'];

  const namePool = getNamePool(spec.setting);

  for (let i = 0; i < config.agentCount; i++) {
    const role = i === 0 ? 'hero' : i === 1 ? 'villain' : rng.pick(roles);
    const alignment: FactionAlignment = role === 'hero' ? 'order'
                                      : role === 'villain' ? 'chaos'
                                      : rng.pick(alignments);
    const startZone = rng.pick(zoneIds);
    const agent: Agent = {
      id: `agent_${i}`,
      name: rng.pick(namePool),
      role,
      state: 'exploring',
      alignment,
      health: 100,
      maxHealth: 100,
      energy: 100,
      position: { x: rng.between(0, 100), y: rng.between(0, 100), zone: startZone },
      stats: {
        strength: Math.floor(rng.between(20, 100)),
        agility: Math.floor(rng.between(20, 100)),
        intelligence: Math.floor(rng.between(20, 100)),
        charisma: Math.floor(rng.between(20, 100)),
      },
      inventory: [],
      memory: {
        visitedZones: [startZone],
        encounteredAgents: [],
        acquiredItems: [],
        completedObjectives: [],
        failedObjectives: [],
      },
      tick: 0,
      narrativeWeight: role === 'hero' || role === 'villain' ? 1.0 : rng.between(0.1, 0.6),
      alive: true,
    };
    agents.set(agent.id, agent);
    world.get(startZone)!.currentAgents.push(agent.id);
  }

  return agents;
}

// ─────────────────────────────────────────────
// AGENT BEHAVIOR (decision loop)
// ─────────────────────────────────────────────

function tickAgent(agent: Agent, world: WorldState, config: SimulationConfig, rng: SeededRandom): SimEvent[] {
  if (!agent.alive) return [];

  const events: SimEvent[] = [];
  const zone = world.zones.get(agent.position.zone);
  if (!zone) return [];

  agent.tick++;
  agent.energy = Math.max(0, agent.energy - rng.between(1, 5));

  // Rest if low energy
  if (agent.energy < 20) {
    agent.state = 'resting';
    agent.energy = Math.min(100, agent.energy + 30);
    return [];
  }

  // Decide action based on role + zone
  const agentsHere = zone.currentAgents
    .filter(id => id !== agent.id)
    .map(id => world.agents.get(id))
    .filter(Boolean) as Agent[];

  const aliveAgentsHere = agentsHere.filter(a => a.alive);

  // ── COMBAT ──
  const enemies = aliveAgentsHere.filter(a =>
    a.alignment !== agent.alignment && rng.chance(config.conflictFrequency)
  );

  if (enemies.length > 0 && agent.role !== 'merchant') {
    const target = rng.pick(enemies);
    const attackRoll = agent.stats.strength * rng.next();
    const defenseRoll = target.stats.agility * rng.next();
    const damage = Math.floor(Math.max(0, attackRoll - defenseRoll) * 0.4);

    target.health = Math.max(0, target.health - damage);
    agent.state = 'pursuing';
    target.state = 'fleeing';

    if (!agent.memory.encounteredAgents.includes(target.id)) {
      agent.memory.encounteredAgents.push(target.id);
    }

    const combatEvent: SimEvent = {
      id: `evt_${Date.now()}_${rng.next()}`,
      tick: world.tick,
      type: 'combat',
      actorIds: [agent.id, target.id],
      zoneId: zone.id,
      description: `${agent.name} attacks ${target.name} in ${zone.name} for ${damage} damage`,
      narrativeImpact: (agent.narrativeWeight + target.narrativeWeight) / 2,
    };
    events.push(combatEvent);

    // Death check
    if (target.health <= 0) {
      target.alive = false;
      target.state = 'dead';
      zone.currentAgents = zone.currentAgents.filter(id => id !== target.id);

      const deathEvent: SimEvent = {
        id: `evt_death_${rng.next()}`,
        tick: world.tick,
        type: 'death',
        actorIds: [agent.id, target.id],
        zoneId: zone.id,
        description: `${target.name} is slain by ${agent.name} in ${zone.name}`,
        narrativeImpact: target.narrativeWeight,
      };
      events.push(deathEvent);

      // Power vacuum if high-weight agent dies
      if (target.narrativeWeight > 0.7 && zone.controlledBy === target.id) {
        zone.controlledBy = undefined;
      }
    }
    return events;
  }

  // ── TRADE ──
  const allies = aliveAgentsHere.filter(a =>
    a.alignment === agent.alignment && rng.chance(config.tradeFrequency)
  );

  if (allies.length > 0 && (agent.role === 'merchant' || rng.chance(0.3))) {
    const partner = rng.pick(allies);
    agent.state = 'trading';
    partner.state = 'trading';

    const tradeItem = getRandomItem(agent.inventory.length > 0 ? 'trade' : 'discover', rng);
    agent.inventory.push(tradeItem);
    agent.memory.acquiredItems.push(tradeItem);

    const tradeEvent: SimEvent = {
      id: `evt_trade_${rng.next()}`,
      tick: world.tick,
      type: 'trade',
      actorIds: [agent.id, partner.id],
      zoneId: zone.id,
      description: `${agent.name} and ${partner.name} trade in ${zone.name}. ${agent.name} acquires ${tradeItem}`,
      narrativeImpact: 0.2,
    };
    events.push(tradeEvent);
    return events;
  }

  // ── MOVE ──
  if (zone.connectedZones.length > 0 && rng.chance(0.4)) {
    const nextZoneId = rng.pick(zone.connectedZones);
    const nextZone = world.zones.get(nextZoneId);
    if (nextZone) {
      zone.currentAgents = zone.currentAgents.filter(id => id !== agent.id);
      nextZone.currentAgents.push(agent.id);
      agent.position.zone = nextZoneId;
      agent.state = 'exploring';

      if (!agent.memory.visitedZones.includes(nextZoneId)) {
        agent.memory.visitedZones.push(nextZoneId);

        // Discovery event
        if (rng.chance(0.3)) {
          const discovery = getRandomItem('discover', rng);
          agent.inventory.push(discovery);
          agent.memory.acquiredItems.push(discovery);

          const discEvent: SimEvent = {
            id: `evt_disc_${rng.next()}`,
            tick: world.tick,
            type: 'discovery',
            actorIds: [agent.id],
            zoneId: nextZoneId,
            description: `${agent.name} discovers ${discovery} in ${nextZone.name}`,
            narrativeImpact: 0.3,
          };
          events.push(discEvent);
        }

        // Zone control shift
        if (agent.role === 'guardian' || agent.role === 'villain') {
          nextZone.controlledBy = agent.id;
          world.factionControl.set(agent.alignment,
            (world.factionControl.get(agent.alignment) || 0) + 1
          );
        }
      }
    }
  }

  // ── OBJECTIVE ──
  if (zone.type === 'sacred' && agent.role === 'hero' && rng.chance(0.2)) {
    agent.memory.completedObjectives.push(`purified_${zone.id}`);
    const questEvent: SimEvent = {
      id: `evt_quest_${rng.next()}`,
      tick: world.tick,
      type: 'quest_complete',
      actorIds: [agent.id],
      zoneId: zone.id,
      description: `${agent.name} completes a sacred rite in ${zone.name}`,
      narrativeImpact: 0.8,
    };
    events.push(questEvent);
  }

  return events;
}

// ─────────────────────────────────────────────
// NARRATIVE THREAD EXTRACTOR
// ─────────────────────────────────────────────

function extractNarrativeThreads(world: WorldState, allEvents: SimEvent[]): NarrativeThread[] {
  const threads: NarrativeThread[] = [];
  const agents = Array.from(world.agents.values());

  const hero = agents.find(a => a.role === 'hero');
  const villain = agents.find(a => a.role === 'villain');

  if (hero) {
    const heroEvents = allEvents.filter(e => e.actorIds.includes(hero.id));
    const tension = hero.alive
      ? Math.min(1, heroEvents.filter(e => e.type === 'combat').length / 10)
      : 1.0;

    const arc: NarrativeArcType = !hero.alive ? 'tragedy'
      : hero.memory.completedObjectives.length > 2 ? 'rise'
      : tension > 0.7 ? 'conflict'
      : 'discovery';

    threads.push({
      id: 'thread_main',
      arc,
      protagonistId: hero.id,
      antagonistId: villain?.id,
      tension,
      keyEvents: heroEvents.slice(-5).map(e => e.id),
      predictedOutcome: predictOutcome(hero, villain, tension),
    });
  }

  // Secondary threads — high-weight agents
  agents
    .filter(a => a.narrativeWeight > 0.5 && a.id !== hero?.id)
    .slice(0, 3)
    .forEach((agent, i) => {
      const agentEvents = allEvents.filter(e => e.actorIds.includes(agent.id));
      threads.push({
        id: `thread_secondary_${i}`,
        arc: agent.alive ? 'rise' : 'fall',
        protagonistId: agent.id,
        tension: rngBetween(0.2, 0.8),
        keyEvents: agentEvents.slice(-3).map(e => e.id),
        predictedOutcome: agent.alive
          ? `${agent.name} continues to ${agent.role === 'villain' ? 'spread chaos' : 'seek purpose'}`
          : `${agent.name}'s legacy echoes through ${agent.memory.visitedZones.length} zones`,
      });
    });

  return threads;
}

function predictOutcome(hero: Agent | undefined, villain: Agent | undefined, tension: number): string {
  if (!hero) return 'The world falls to chaos without a champion.';
  if (!hero.alive) return `${hero.name} fell before their destiny was fulfilled. The darkness spreads.`;
  if (villain && !villain.alive) return `${hero.name} has defeated ${villain.name}. An uneasy peace follows.`;
  if (tension > 0.7) return `${hero.name} and ${villain?.name ?? 'the darkness'} are on a collision course. Resolution imminent.`;
  if (hero.memory.completedObjectives.length > 2) return `${hero.name} grows in power — the final confrontation approaches.`;
  return `${hero.name} explores, learns, and prepares. The real conflict has yet to begin.`;
}

// ─────────────────────────────────────────────
// EMERGENT NARRATIVE SYNTHESIZER
// ─────────────────────────────────────────────

function synthesizeNarrative(result: Omit<SimulationResult, 'emergentNarrative'>, spec: GameSpec): string {
  const threads = result.narrativeThreads;
  const mainThread = threads.find(t => t.id === 'thread_main');
  const combatEvents = result.keyEvents.filter(e => e.type === 'combat').length;
  const deathEvents = result.keyEvents.filter(e => e.type === 'death').length;
  const discoveries = result.keyEvents.filter(e => e.type === 'discovery').length;

  const agents = Array.from(result.agentHistories.keys());
  const dominant = result.dominantFaction;

  let narrative = '';

  // Opening
  narrative += `In a ${spec.setting} world torn by ${dominant === 'chaos' ? 'conflict and instability' : dominant === 'order' ? 'rigid control and oppression' : 'uneasy equilibrium'}, `;

  // Main arc
  if (mainThread) {
    narrative += `a ${mainThread.arc === 'tragedy' ? 'doomed' : mainThread.arc === 'rise' ? 'rising' : 'embattled'} ${spec.genre === 'rpg' ? 'hero' : 'protagonist'} emerges. `;
    narrative += `${mainThread.predictedOutcome} `;
  }

  // World texture
  if (combatEvents > 5) {
    narrative += `Blood has been spilled across ${Math.min(combatEvents, 9)} battlegrounds. `;
  }
  if (discoveries > 3) {
    narrative += `Ancient secrets surface as explorers push into uncharted zones. `;
  }
  if (deathEvents > 0) {
    narrative += `${deathEvents} ${deathEvents === 1 ? 'soul has' : 'souls have'} already been claimed by this world. `;
  }

  // Hooks
  const hooks = result.recommendations.narrativeHooks;
  if (hooks.length > 0) {
    narrative += hooks[0];
  }

  return narrative.trim();
}

// ─────────────────────────────────────────────
// MAIN SIMULATION RUNNER
// ─────────────────────────────────────────────

export function runSimulation(spec: GameSpec, config: SimulationConfig): SimulationResult {
  const seed = config.seed ?? Date.now();
  const rng = new SeededRandom(seed);

  // Build world
  const zones = buildWorld(spec, config, rng);
  const agents = spawnAgents(spec, config, zones, rng);

  const worldState: WorldState = {
    tick: 0,
    zones,
    agents,
    globalEvents: [],
    factionControl: new Map([['order', 0], ['chaos', 0], ['neutral', 0]]),
    narrativeThreads: [],
  };

  const allEvents: SimEvent[] = [];
  const agentHistories = new Map<string, SimEvent[]>();

  // Initialize agent histories
  for (const id of agents.keys()) {
    agentHistories.set(id, []);
  }

  // ── MAIN TICK LOOP ──
  for (let tick = 0; tick < config.maxTicks; tick++) {
    worldState.tick = tick;

    for (const agent of agents.values()) {
      if (!agent.alive) continue;

      const events = tickAgent(agent, worldState, config, rng);
      for (const event of events) {
        allEvents.push(event);
        worldState.globalEvents.push(event);
        for (const actorId of event.actorIds) {
          agentHistories.get(actorId)?.push(event);
        }
      }
    }
  }

  // ── POST-SIM ANALYSIS ──
  const survivors = Array.from(agents.values()).filter(a => a.alive);
  const factionCounts = new Map<FactionAlignment, number>();
  for (const a of survivors) {
    factionCounts.set(a.alignment, (factionCounts.get(a.alignment) ?? 0) + 1);
  }

  let dominantFaction: FactionAlignment = 'neutral';
  let maxCount = 0;
  for (const [faction, count] of factionCounts) {
    if (count > maxCount) { maxCount = count; dominantFaction = faction; }
  }

  // Zone analysis
  const zoneArr = Array.from(zones.values());
  const mostContested = zoneArr.sort((a, b) => b.events.length - a.events.length)[0]?.name ?? 'Unknown';
  const mostPeaceful = zoneArr.sort((a, b) => a.dangerLevel - b.dangerLevel)[0]?.name ?? 'Unknown';
  const powerVacuums = zoneArr.filter(z => !z.controlledBy).map(z => z.name).slice(0, 3);
  const tradeHubs = zoneArr
    .filter(z => allEvents.filter(e => e.type === 'trade' && e.zoneId === z.id).length > 2)
    .map(z => z.name)
    .slice(0, 3);

  // Extract narrative threads
  const narrativeThreads = extractNarrativeThreads(worldState, allEvents);

  // High-impact events
  const keyEvents = allEvents
    .filter(e => e.narrativeImpact > 0.5)
    .sort((a, b) => b.narrativeImpact - a.narrativeImpact)
    .slice(0, 20);

  // Recommendations
  const emergentMechanics = deriveEmergentMechanics(allEvents, spec);
  const narrativeHooks = deriveNarrativeHooks(narrativeThreads, allEvents, agents);

  const partialResult = {
    totalTicks: config.maxTicks,
    agentCount: config.agentCount,
    survivorCount: survivors.length,
    dominantFaction,
    narrativeThreads,
    keyEvents,
    worldState: { mostContestedZone: mostContested, mostPeacefulZone: mostPeaceful, powerVacuums, tradeHubs },
    recommendations: {
      suggestedProtagonistRole: 'hero' as AgentRole,
      suggestedAntagonistRole: 'villain' as AgentRole,
      recommendedStartZone: mostPeaceful,
      emergentMechanics,
      narrativeHooks,
    },
    rawEvents: allEvents,
    agentHistories,
    emergentNarrative: '',
  };

  partialResult.emergentNarrative = synthesizeNarrative(partialResult, spec);

  return partialResult;
}

// ─────────────────────────────────────────────
// SPEC ENRICHER — plugs SimResult into GameSpec
// ─────────────────────────────────────────────

export function enrichSpecWithSimulation(spec: GameSpec, sim: SimulationResult): GameSpec & { simulationData: SimulationResult } {
  return {
    ...spec,
    simulationData: sim,
  };
}

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

function deriveEmergentMechanics(events: SimEvent[], spec: GameSpec): string[] {
  const mechanics: string[] = [];
  const combatCount = events.filter(e => e.type === 'combat').length;
  const tradeCount = events.filter(e => e.type === 'trade').length;
  const deathCount = events.filter(e => e.type === 'death').length;
  const discoveryCount = events.filter(e => e.type === 'discovery').length;

  if (combatCount > 10) mechanics.push('faction_warfare');
  if (combatCount > 5) mechanics.push('territorial_control');
  if (tradeCount > 5) mechanics.push('dynamic_economy');
  if (deathCount > 3) mechanics.push('permadeath_consequences');
  if (discoveryCount > 5) mechanics.push('exploration_reward_loop');
  if (events.filter(e => e.type === 'alliance').length > 0) mechanics.push('faction_diplomacy');
  if (spec.genre === 'rpg' && tradeCount > 3) mechanics.push('reputation_system');
  if (combatCount > 0 && tradeCount > 0) mechanics.push('conflict_vs_cooperation_choice');

  return mechanics.slice(0, 5);
}

function deriveNarrativeHooks(threads: NarrativeThread[], events: SimEvent[], agents: Map<string, Agent>): string[] {
  const hooks: string[] = [];
  const mainThread = threads.find(t => t.id === 'thread_main');

  if (mainThread?.tension && mainThread.tension > 0.6) {
    hooks.push('A long-simmering conflict finally demands resolution — the player cannot remain neutral.');
  }

  const deadHeavyweights = Array.from(agents.values())
    .filter(a => !a.alive && a.narrativeWeight > 0.6);
  if (deadHeavyweights.length > 0) {
    hooks.push(`The death of ${deadHeavyweights[0].name} has left a power vacuum that factions scramble to fill.`);
  }

  const questEvents = events.filter(e => e.type === 'quest_complete');
  if (questEvents.length > 0) {
    hooks.push('Ancient rites have been performed — something powerful stirs in response.');
  }

  const betrayals = events.filter(e => e.type === 'betrayal');
  if (betrayals.length > 0) {
    hooks.push('Trust, once broken, reshapes every alliance that follows.');
  }

  hooks.push('The simulation has spoken: this world\'s story begins in its most contested zone.');

  return hooks.slice(0, 3);
}

function getRandomItem(context: 'trade' | 'discover', rng: SeededRandom): string {
  const tradeItems = ['ancient_coin', 'healing_herb', 'crude_map', 'stolen_weapon', 'encrypted_message', 'rare_ore', 'faction_sigil'];
  const discoverItems = ['lost_relic', 'hidden_cache', 'ancient_inscription', 'forgotten_weapon', 'sacred_artifact', 'cryptic_tome', 'power_core'];
  return rng.pick(context === 'trade' ? tradeItems : discoverItems);
}

function rngBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function getNamePool(setting: string): string[] {
  const pools: Record<string, string[]> = {
    'sci-fi': ['Zara', 'Kade', 'Nyx', 'Vex', 'Orion', 'Lyra', 'Dex', 'Cael', 'Sable', 'Riven', 'Echo', 'Flux'],
    'fantasy': ['Aldric', 'Seraphine', 'Theron', 'Mira', 'Caelum', 'Isolde', 'Brennan', 'Aelith', 'Gareth', 'Sylva'],
    'modern': ['Alex', 'Jordan', 'Casey', 'Morgan', 'Riley', 'Quinn', 'Avery', 'Reese', 'Blake', 'Drew'],
    'post-apocalyptic': ['Ash', 'Cinder', 'Ruin', 'Drift', 'Scar', 'Vane', 'Hollow', 'Grit', 'Dust', 'Ember'],
    'historical': ['Edmund', 'Isolde', 'Alaric', 'Rowena', 'Siegfried', 'Matilda', 'Aldous', 'Cecily'],
  };
  return pools[setting] ?? pools['modern'];
}

function getZoneTemplates(setting: string, genre: string): Array<{ name: string; type: WorldZone['type'] }> {
  const templates: Record<string, Array<{ name: string; type: WorldZone['type'] }>> = {
    'sci-fi': [
      { name: 'Neon District', type: 'neutral' },
      { name: 'Corporate Spire', type: 'hostile' },
      { name: 'Underground Market', type: 'safe' },
      { name: 'Data Vault', type: 'sacred' },
      { name: 'Reactor Core', type: 'hostile' },
      { name: 'Refugee Camp', type: 'safe' },
      { name: 'Contested Sector', type: 'contested' },
    ],
    'fantasy': [
      { name: 'Ancient Forest', type: 'neutral' },
      { name: 'Dark Citadel', type: 'hostile' },
      { name: 'Village Square', type: 'safe' },
      { name: 'Sacred Grove', type: 'sacred' },
      { name: 'Cursed Ruins', type: 'hostile' },
      { name: 'Merchant Road', type: 'neutral' },
      { name: 'Battlefront', type: 'contested' },
    ],
    'post-apocalyptic': [
      { name: 'The Wastes', type: 'hostile' },
      { name: 'Survivor Camp', type: 'safe' },
      { name: 'Ruined City', type: 'contested' },
      { name: 'Vault Entrance', type: 'sacred' },
      { name: 'Raider Territory', type: 'hostile' },
      { name: 'Trading Post', type: 'neutral' },
      { name: 'Contested Refinery', type: 'contested' },
    ],
    'modern': [
      { name: 'Financial District', type: 'neutral' },
      { name: 'Underground Network', type: 'hostile' },
      { name: 'Safe House', type: 'safe' },
      { name: 'Server Farm', type: 'sacred' },
      { name: 'Contested Territory', type: 'contested' },
      { name: 'Market District', type: 'neutral' },
      { name: 'Restricted Zone', type: 'hostile' },
    ],
  };
  return templates[setting] ?? templates['modern'];
}
