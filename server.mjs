import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs/promises';
import OpenAI from 'openai';
import axios from 'axios';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Ensure generated games directory exists
const GAMES_DIR = path.join(__dirname, 'generated_games');
async function ensureGamesDir() {
  try {
    await fs.mkdir(GAMES_DIR, { recursive: true });
  } catch (err) {
    console.warn('Games dir not writable — running in stateless mode');
  }
}
ensureGamesDir().catch(() => console.warn('Stateless mode active'));

// Get API status
app.get('/api/status', (req, res) => {
  const hasOpenAI = !!process.env.OPENAI_API_KEY;
  const hasStabilityAI = !!process.env.STABILITY_API_KEY;
  const hasAnthropic = !!process.env.ANTHROPIC_API_KEY;
  
  res.json({
    status: 'operational',
    apis: {
      openai: { configured: hasOpenAI, status: hasOpenAI ? 'ready' : 'not_configured' },
      stability: { configured: hasStabilityAI, status: hasStabilityAI ? 'ready' : 'not_configured' },
      anthropic: { configured: hasAnthropic, status: hasAnthropic ? 'ready' : 'not_configured' }
    },
    models: {
      gameDesign: hasOpenAI || hasAnthropic ? 'available' : 'unavailable',
      textureGen: hasStabilityAI ? 'available' : 'fallback_mode',
      meshGen: 'procedural_only'
    }
  });
});

// Update API keys
app.post('/api/config', async (req, res) => {
  const { openai, stability, anthropic } = req.body;
  
  try {
    // Update environment variables
    if (openai) process.env.OPENAI_API_KEY = openai;
    if (stability) process.env.STABILITY_API_KEY = stability;
    if (anthropic) process.env.ANTHROPIC_API_KEY = anthropic;
    
    // Write to .env file
    const envContent = `
OPENAI_API_KEY=${process.env.OPENAI_API_KEY || ''}
STABILITY_API_KEY=${process.env.STABILITY_API_KEY || ''}
ANTHROPIC_API_KEY=${process.env.ANTHROPIC_API_KEY || ''}
`.trim();
    
    await fs.writeFile(path.join(__dirname, '.env'), envContent);
    
    res.json({ success: true, message: 'API keys updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get current API configuration (masked)
app.get('/api/config', (req, res) => {
  res.json({
    openai: { configured: !!process.env.OPENAI_API_KEY, key: maskKey(process.env.OPENAI_API_KEY) },
    stability: { configured: !!process.env.STABILITY_API_KEY, key: maskKey(process.env.STABILITY_API_KEY) },
    anthropic: { configured: !!process.env.ANTHROPIC_API_KEY, key: maskKey(process.env.ANTHROPIC_API_KEY) }
  });
});

function maskKey(key) {
  if (!key) return null;
  if (key.length <= 8) return '****';
  return key.slice(0, 4) + '****' + key.slice(-4);
}

// Generate game design using AI
async function generateGameDesign(spec) {
  const hasOpenAI = !!process.env.OPENAI_API_KEY;
  const hasAnthropic = !!process.env.ANTHROPIC_API_KEY;
  
  if (!hasOpenAI && !hasAnthropic) {
    // Fallback to template-based generation
    return generateTemplateDesign(spec);
  }
  
  const prompt = `Generate a detailed game design document for a ${spec.genre} game with the following specifications:

Title: ${spec.title}
Genre: ${spec.genre}
Style: ${spec.style}
Setting: ${spec.setting}
Platform: ${spec.target_platform}
Complexity: ${spec.complexity}

Please provide:
1. Core gameplay mechanics (5-8 specific mechanics)
2. Art direction description
3. Level structure (number of areas, connections, estimated playtime)
4. Character roles (player, enemies, NPCs)
5. Key features that make this game unique
6. Narrative outline (2-3 sentences)
7. Progression system description

Return as JSON with these exact keys: core_mechanics (array), art_direction (string), level_structure (object with rooms, connections, size, estimated_playtime), character_roles (array), key_features (array), narrative_outline (string), progression_system (object).

Make it creative and specific to the genre and setting. Be detailed and professional.`;

  try {
    let response;
    
    if (hasOpenAI) {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a professional game designer. Generate detailed, creative game design documents. Always return valid JSON.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.8,
        response_format: { type: 'json_object' }
      });
      return JSON.parse(response.choices[0].message.content);
    } else if (hasAnthropic) {
      // Use Anthropic as fallback
      response = await axios.post('https://api.anthropic.com/v1/messages', {
        model: 'claude-3-sonnet-20240229',
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }]
      }, {
        headers: {
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01'
        }
      });
      const content = response.data.content[0].text;
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      return jsonMatch ? JSON.parse(jsonMatch[0]) : generateTemplateDesign(spec);
    }
  } catch (err) {
    console.error('AI generation error:', err);
    return generateTemplateDesign(spec);
  }
}

function generateTemplateDesign(spec) {
  const mechanics = {
    fps: ['shooting', 'movement', 'aiming', 'health_system', 'cover_system', 'weapon_switching', 'reload_system', 'headshots'],
    rpg: ['quest_system', 'inventory', 'leveling', 'dialogue', 'skill_trees', 'fast_travel', 'crafting', 'equipment'],
    platformer: ['jumping', 'running', 'collecting', 'enemy_avoidance', 'power_ups', 'wall_jump', 'double_jump', 'speed_run'],
    survival: ['resource_gathering', 'crafting', 'hunger', 'shelter', 'day_night_cycle', 'base_building', 'farming', 'taming'],
    racing: ['driving', 'boosting', 'drifting', 'race_positions', 'vehicle_customization', 'time_trials', 'tournaments'],
    puzzle: ['block_manipulation', 'pattern_matching', 'time_pressure', 'hint_system', 'scoring', 'leaderboards']
  };
  
  const narratives = {
    'sci-fi': {
      fps: 'In a dystopian cyberpunk future, you are a rogue agent fighting against a corrupt megacorporation that controls the city.',
      rpg: 'As a space explorer, you discover an ancient alien artifact that grants mysterious powers and attracts dangerous enemies.',
      platformer: 'A malfunctioning robot must navigate through a massive space station to find its creator and prevent a catastrophic failure.',
      survival: 'Stranded on an alien planet, you must use advanced technology to survive the hostile environment and find a way home.'
    },
    'fantasy': {
      fps: 'An arcane marksman uses enchanted firearms to hunt down dark creatures threatening the realm.',
      rpg: 'A chosen hero must unite the fractured kingdoms against an ancient evil awakening from its thousand-year slumber.',
      platformer: 'A young wizard apprentice jumps through magical realms to collect spell components and defeat an evil sorcerer.',
      survival: 'Banished to a cursed wilderness, you must master ancient magic and tame mythical beasts to survive.'
    },
    'modern': {
      fps: 'An elite special forces operative takes on a global terrorist organization threatening world peace.',
      rpg: 'A detective discovers a conspiracy that spans the city\'s criminal underworld and corrupt government.',
      platformer: 'A parkour runner navigates the urban landscape to deliver important messages while evading capture.',
      survival: 'After a natural disaster, survivors must work together to rebuild their community amidst scarce resources.'
    },
    'post-apocalyptic': {
      fps: 'A wasteland mercenary fights for survival and resources in a world devastated by nuclear war.',
      rpg: 'The last guardian of ancient knowledge must protect it from raiders while searching for a way to restore civilization.',
      platformer: 'A mutated creature navigates the ruins of a fallen civilization to find the source of the contamination.',
      survival: 'In a world where resources are scarce, factions war over the last habitable territories.'
    }
  };
  
  const levelStructures = {
    simple: { rooms: 3, connections: 'linear', size: 'small', estimated_playtime: '5-10 minutes' },
    medium: { rooms: 8, connections: 'branching', size: 'medium', estimated_playtime: '15-30 minutes' },
    complex: { rooms: 20, connections: 'open_world', size: 'large', estimated_playtime: '1-2 hours' }
  };
  
  const genreMechanics = mechanics[spec.genre] || mechanics.fps;
  const settingNarratives = narratives[spec.setting] || narratives.modern;
  const narrative = settingNarratives[spec.genre] || 'An epic adventure awaits.';
  
  return {
    core_mechanics: genreMechanics,
    art_direction: `${spec.style} ${spec.setting} aesthetic with immersive environmental storytelling`,
    level_structure: levelStructures[spec.complexity],
    character_roles: [
      { role: 'player', type: 'protagonist', importance: 'primary' },
      { role: 'enemy', type: 'standard', count: spec.complexity === 'simple' ? 3 : spec.complexity === 'medium' ? 5 : 8, importance: 'secondary' },
      { role: 'npc', type: 'quest_giver', count: 2, importance: 'supporting' },
      { role: 'npc', type: 'merchant', count: 1, importance: 'optional' }
    ],
    key_features: ['dynamic_difficulty', 'procedural_elements', 'achievement_system', 'save_anywhere'],
    narrative_outline: narrative,
    progression_system: {
      type: spec.genre === 'rpg' ? 'experience' : 'level_based',
      unlockables: ['new_weapons', 'new_abilities', 'cosmetics', 'concept_art'],
      difficulty_scaling: true,
      new_game_plus: spec.complexity === 'complex'
    }
  };
}

// Generate 3D mesh data procedurally
function generateMesh(assetType, setting, index) {
  const vertices = [];
  const faces = [];
  const uvs = [];
  const normals = [];
  
  // Procedural mesh generation based on asset type
  const complexity = assetType === 'character' ? 500 : assetType === 'enemy' ? 400 : 100;
  
  // Generate vertices in a rough shape based on type
  for (let i = 0; i < complexity; i++) {
    const angle = (i / complexity) * Math.PI * 2;
    const radius = 0.3 + Math.random() * 0.2;
    const height = (i / complexity) * (assetType === 'character' ? 1.8 : 1.0) - 0.9;
    
    vertices.push([
      Math.cos(angle) * radius + (Math.random() - 0.5) * 0.1,
      height,
      Math.sin(angle) * radius + (Math.random() - 0.5) * 0.1
    ]);
    
    uvs.push([i / complexity, height + 0.5]);
    normals.push([Math.cos(angle), 0, Math.sin(angle)]);
  }
  
  // Generate faces (triangles)
  for (let i = 0; i < complexity - 2; i++) {
    faces.push([i, i + 1, i + 2]);
  }
  
  return { vertices, faces, uvs, normals };
}

// Generate texture using AI or fallback
async function generateTexture(prompt, size = 256) {
  const hasStability = !!process.env.STABILITY_API_KEY;
  
  if (!hasStability) {
    // Return procedural texture data
    return generateProceduralTexture(size);
  }
  
  try {
    const response = await axios.post('https://api.stability.ai/v2beta/stable-image/generate/sd3', {
      prompt: prompt,
      output_format: 'png',
      width: size,
      height: size
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.STABILITY_API_KEY}`,
        'Content-Type': 'application/json'
      },
      responseType: 'arraybuffer'
    });
    
    return Buffer.from(response.data).toString('base64');
  } catch (err) {
    console.error('Texture generation error:', err);
    return generateProceduralTexture(size);
  }
}

function generateProceduralTexture(size) {
  // Generate a simple procedural texture as base64
  const canvas = Buffer.alloc(size * size * 4);
  for (let i = 0; i < size * size; i++) {
    const x = i % size;
    const y = Math.floor(i / size);
    const noise = Math.random() * 50 + 100;
    canvas[i * 4] = noise;     // R
    canvas[i * 4 + 1] = noise; // G
    canvas[i * 4 + 2] = noise; // B
    canvas[i * 4 + 3] = 255;   // A
  }
  return canvas.toString('base64');
}

// Main game generation endpoint
app.post('/api/generate', async (req, res) => {
  const spec = req.body;
  const gameId = `game_${Date.now()}`;
  
  try {
    // Step 1: Generate game design
    const design = await generateGameDesign(spec);
    
    // Step 2: Generate assets
    const numEnemies = spec.complexity === 'simple' ? 3 : spec.complexity === 'medium' ? 5 : 8;
    const assets = [];
    
    // Player character
    const playerMesh = generateMesh('character', spec.setting, 0);
    assets.push({
      name: 'player',
      type: 'character',
      vertex_count: playerMesh.vertices.length,
      face_count: playerMesh.faces.length,
      has_texture: true,
      has_animations: true,
      mesh: playerMesh
    });
    
    // Enemies
    for (let i = 0; i < numEnemies; i++) {
      const enemyMesh = generateMesh('enemy', spec.setting, i);
      assets.push({
        name: `enemy_${i}`,
        type: 'enemy',
        vertex_count: enemyMesh.vertices.length,
        face_count: enemyMesh.faces.length,
        has_texture: true,
        has_animations: true,
        mesh: enemyMesh
      });
    }
    
    // Props
    const propTypes = spec.setting === 'sci-fi' 
      ? ['crate', 'console', 'barrier', 'turret', 'vehicle']
      : spec.setting === 'fantasy'
      ? ['crate', 'barrel', 'rock', 'tree', 'ruins', 'chest']
      : ['crate', 'barrel', 'rock', 'tree', 'building', 'vehicle'];
    
    for (const propType of propTypes) {
      const propMesh = generateMesh('prop', spec.setting, 0);
      assets.push({
        name: propType,
        type: 'prop',
        vertex_count: propMesh.vertices.length,
        face_count: propMesh.faces.length,
        has_texture: true,
        has_animations: false,
        mesh: propMesh
      });
    }
    
    // Weapons (if applicable)
    if (spec.genre !== 'platformer' && spec.genre !== 'puzzle') {
      const weaponTypes = spec.setting === 'fantasy' 
        ? ['sword', 'bow', 'staff']
        : ['pistol', 'rifle', 'melee'];
      
      for (const weaponType of weaponTypes) {
        const weaponMesh = generateMesh('weapon', spec.setting, 0);
        assets.push({
          name: weaponType,
          type: 'weapon',
          vertex_count: weaponMesh.vertices.length,
          face_count: weaponMesh.faces.length,
          has_texture: true,
          has_animations: false,
          mesh: weaponMesh
        });
      }
    }
    
    // Step 3: Generate scenes
    const numScenes = spec.complexity === 'complex' ? 3 : 1;
    const scenes = [];
    
    for (let i = 0; i < numScenes; i++) {
      scenes.push({
        name: `level_0${i + 1}`,
        asset_count: Math.min(assets.length, 10),
        lighting: generateLighting(spec.setting),
        camera: generateCamera(spec.genre),
        physics: generatePhysics(spec.genre),
        gameplay_logic: {
          spawn_points: [[0, 0, 0], [10, 0, 10], [-10, 0, -10]],
          objectives: generateObjectives(spec.genre),
          triggers: [],
          checkpoints: [[0, 0, 0], [20, 0, 0], [40, 0, 0]]
        },
        spawn_points: [[0, 0, 0], [10, 0, 10], [-10, 0, -10]]
      });
    }
    
    // Step 4: Generate gameplay logic
    const code = generateGameplayLogic(spec);
    
    // Step 5: Export config
    const exportConfig = {
      platform: spec.target_platform,
      format: getExportFormat(spec.target_platform),
      engine: 'Unity/Unreal/Godot',
      file_structure: {
        'Assets/': '3D models, textures, animations, audio',
        'Scenes/': 'Level files and scene data',
        'Scripts/': 'Gameplay code and logic',
        'Prefabs/': 'Reusable game objects',
        'Materials/': 'Shader and material definitions',
        'Config/': 'Game configuration files',
        'Build/': 'Compiled output directory'
      },
      build_config: generateBuildConfig(spec.target_platform),
      dependencies: getDependencies(spec.target_platform)
    };
    
    // Compile game package
    const gamePackage = {
      id: gameId,
      spec,
      design,
      assets,
      scenes,
      code,
      export_config: exportConfig,
      generated_at: new Date().toISOString()
    };
    
    // Save to disk
    const gameDir = path.join(GAMES_DIR, gameId);
    await fs.mkdir(gameDir, { recursive: true });
    await fs.writeFile(
      path.join(gameDir, 'game.json'),
      JSON.stringify(gamePackage, null, 2)
    );
    
    // Save assets as OBJ files
    const assetsDir = path.join(gameDir, 'assets');
    await fs.mkdir(assetsDir, { recursive: true });
    
    for (const asset of assets) {
      const objContent = convertToOBJ(asset);
      await fs.writeFile(path.join(assetsDir, `${asset.name}.obj`), objContent);
    }
    
    // Save scenes
    const scenesDir = path.join(gameDir, 'scenes');
    await fs.mkdir(scenesDir, { recursive: true });
    
    for (const scene of scenes) {
      await fs.writeFile(
        path.join(scenesDir, `${scene.name}.json`),
        JSON.stringify(scene, null, 2)
      );
    }
    
    res.json({
      success: true,
      game: gamePackage,
      download_url: `/api/games/${gameId}/download`
    });
    
  } catch (err) {
    console.error('Game generation error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

function generateLighting(setting) {
  const configs = {
    'sci-fi': {
      ambient: [0.2, 0.2, 0.3],
      directional: { color: [0.8, 0.9, 1.0], direction: [-0.3, -1.0, -0.2], intensity: 1.0 },
      point_lights: [{ color: [0.5, 0.7, 1.0], position: [5, 3, 5], intensity: 2.0 }]
    },
    'fantasy': {
      ambient: [0.3, 0.25, 0.2],
      directional: { color: [1.0, 0.9, 0.7], direction: [-0.5, -1.0, -0.3], intensity: 1.0 },
      point_lights: [{ color: [1.0, 0.6, 0.3], position: [0, 2, 0], intensity: 1.5 }]
    },
    'modern': {
      ambient: [0.3, 0.3, 0.3],
      directional: { color: [1.0, 1.0, 0.95], direction: [-0.4, -1.0, -0.2], intensity: 1.0 },
      point_lights: []
    },
    'post-apocalyptic': {
      ambient: [0.15, 0.15, 0.15],
      directional: { color: [0.9, 0.7, 0.5], direction: [-0.5, -1.0, -0.3], intensity: 0.8 },
      point_lights: [{ color: [1.0, 0.4, 0.2], position: [3, 1, 3], intensity: 1.5 }]
    }
  };
  return configs[setting] || configs.modern;
}

function generateCamera(genre) {
  const cameras = {
    fps: { type: 'first_person', fov: 75, near: 0.01, far: 1000.0 },
    tps: { type: 'third_person', fov: 60, near: 0.1, far: 1000.0, distance: 5.0 },
    platformer: { type: 'side_scrolling', fov: 50, near: 0.1, far: 500.0 },
    rpg: { type: 'third_person', fov: 65, near: 0.1, far: 2000.0, distance: 7.0 },
    survival: { type: 'first_person', fov: 70, near: 0.01, far: 1500.0 },
    racing: { type: 'chase_camera', fov: 80, near: 0.1, far: 2000.0, distance: 8.0 }
  };
  return cameras[genre] || cameras.fps;
}

function generatePhysics(genre) {
  return {
    gravity: [0, -9.81, 0],
    collision_system: genre === 'fps' || genre === 'tps' ? 'mesh' : 'aabb',
    ragdoll: genre === 'fps' || genre === 'action',
    destructible: genre === 'fps' || genre === 'action' || genre === 'survival',
    time_scale: 1.0,
    solver_iterations: 8
  };
}

function generateObjectives(genre) {
  const objectives = {
    fps: ['eliminate_targets', 'reach_extraction', 'defend_position'],
    rpg: ['complete_quest', 'defeat_boss', 'explore_area'],
    platformer: ['reach_goal', 'collect_items', 'avoid_obstacles'],
    survival: ['survive_waves', 'gather_resources', 'craft_items'],
    racing: ['finish_first', 'beat_time', 'collect_powerups'],
    puzzle: ['solve_puzzle', 'reach_exit', 'collect_all_pieces']
  };
  return objectives[genre] || ['reach_goal'];
}

function generateGameplayLogic(spec) {
  const controllers = {
    fps: {
      movement_speed: 5.0,
      sprint_speed: 8.0,
      crouch_speed: 2.0,
      rotation_speed: 3.0,
      input_mapping: {
        move_forward: 'W', move_backward: 'S', strafe_left: 'A', strafe_right: 'D',
        sprint: 'Shift', crouch: 'Ctrl', fire: 'Mouse0', aim: 'Mouse1',
        reload: 'R', interact: 'E', weapon_1: '1', weapon_2: '2'
      }
    },
    rpg: {
      movement_speed: 4.0,
      sprint_speed: 7.0,
      rotation_speed: 2.0,
      input_mapping: {
        move_forward: 'W', move_backward: 'S', turn_left: 'A', turn_right: 'D',
        interact: 'E', inventory: 'Tab', skills: 'K', map: 'M', quest_log: 'J'
      }
    },
    platformer: {
      movement_speed: 6.0,
      jump_force: 12.0,
      air_control: 0.5,
      double_jump: true,
      wall_jump: true,
      input_mapping: {
        move_left: 'A', move_right: 'D', jump: 'Space', attack: 'Mouse0', special: 'Shift'
      }
    },
    survival: {
      movement_speed: 4.5,
      sprint_speed: 7.0,
      stamina_drain: 10.0,
      input_mapping: {
        move_forward: 'W', move_backward: 'S', strafe_left: 'A', strafe_right: 'D',
        sprint: 'Shift', crouch: 'Ctrl', interact: 'E', inventory: 'Tab', craft: 'C'
      }
    }
  };
  
  const aiConfigs = {
    simple: { behaviors: ['idle', 'chase'], detection_range: 10.0, attack_range: 2.0, health: 50, damage: 5 },
    medium: { behaviors: ['patrol', 'chase', 'attack', 'retreat'], detection_range: 15.0, attack_range: 2.0, health: 100, damage: 10, patrol_points: 4 },
    complex: { behaviors: ['patrol', 'investigate', 'chase', 'attack', 'retreat', 'flank'], detection_range: 20.0, attack_range: 2.5, health: 150, damage: 15, patrol_points: 6, group_tactics: true }
  };
  
  return {
    player_controller: controllers[spec.genre] || controllers.fps,
    enemy_ai: aiConfigs[spec.complexity] || aiConfigs.medium,
    game_manager: {
      game_modes: ['single_player'],
      win_condition: 'complete_objectives',
      lose_condition: 'player_death',
      checkpoint_system: true,
      save_system: true,
      difficulty_levels: ['easy', 'normal', 'hard'],
      achievements: generateAchievements(spec.genre)
    },
    ui_system: {
      hud_elements: getHUDElements(spec.genre),
      menus: ['main_menu', 'pause_menu', 'settings', 'credits'],
      font: 'default',
      color_scheme: spec.setting === 'sci-fi' || spec.setting === 'post-apocalyptic' ? 'dark' : 'light'
    },
    physics_config: generatePhysics(spec.genre)
  };
}

function generateAchievements(genre) {
  const achievements = {
    fps: [
      { id: 'first_blood', name: 'First Blood', description: 'Get your first kill' },
      { id: 'headshot_master', name: 'Headshot Master', description: 'Get 50 headshots' },
      { id: 'survivor', name: 'Survivor', description: 'Complete a level without dying' }
    ],
    rpg: [
      { id: 'quest_complete', name: 'Quest Complete', description: 'Complete your first quest' },
      { id: 'level_10', name: 'Rising Star', description: 'Reach level 10' },
      { id: 'treasure_hunter', name: 'Treasure Hunter', description: 'Find 10 hidden treasures' }
    ],
    platformer: [
      { id: 'jump_start', name: 'Jump Start', description: 'Complete the first level' },
      { id: 'coin_collector', name: 'Coin Collector', description: 'Collect 100 coins' },
      { id: 'speed_runner', name: 'Speed Runner', description: 'Complete a level in under 60 seconds' }
    ],
    survival: [
      { id: 'first_night', name: 'First Night', description: 'Survive your first night' },
      { id: 'crafter', name: 'Crafter', description: 'Craft your first item' },
      { id: 'explorer', name: 'Explorer', description: 'Discover 5 new locations' }
    ]
  };
  return achievements[genre] || [];
}

function getHUDElements(genre) {
  const huds = {
    fps: ['health_bar', 'ammo_count', 'minimap', 'crosshair', 'weapon_icon', 'grenade_count'],
    rpg: ['health_bar', 'mana_bar', 'minimap', 'quest_log', 'inventory_button', 'skill_bar'],
    platformer: ['health_bar', 'score', 'lives', 'powerup_indicator', 'coin_count'],
    survival: ['health_bar', 'hunger_bar', 'thirst_bar', 'stamina_bar', 'temperature'],
    racing: ['speedometer', 'position', 'lap_counter', 'boost_meter', 'minimap']
  };
  return huds[genre] || ['health_bar'];
}

function getExportFormat(platform) {
  const formats = { pc: 'exe/dll', console: 'pkg', mobile: 'apk/ipa', web: 'wasm/js' };
  return formats[platform] || 'zip';
}

function generateBuildConfig(platform) {
  const configs = {
    pc: { target_architecture: 'x64', graphics_api: 'DirectX 12 / Vulkan', resolution: '1920x1080', frame_rate: 60, windowed: true },
    console: { target_architecture: 'x64', graphics_api: 'Proprietary', resolution: '4K', frame_rate: 60, hdr: true },
    mobile: { target_architecture: 'ARM64', graphics_api: 'OpenGL ES / Vulkan', resolution: 'Adaptive', frame_rate: 30, touch_controls: true },
    web: { target_architecture: 'wasm', graphics_api: 'WebGL 2.0', resolution: 'Adaptive', frame_rate: 60 }
  };
  return configs[platform] || configs.pc;
}

function getDependencies(platform) {
  const deps = {
    pc: ['DirectX Runtime', 'Visual C++ Redistributable'],
    console: ['Console SDK', 'Certification Tools'],
    mobile: ['Android SDK / Xcode', 'Gradle / CocoaPods'],
    web: ['WebGL 2.0 Compatible Browser']
  };
  return deps[platform] || [];
}

function convertToOBJ(asset) {
  const { mesh, name } = asset;
  let obj = `# ${name}\n# Generated by NeuroForge Game Agency\n\n`;
  
  // Vertices
  for (const v of mesh.vertices) {
    obj += `v ${v[0].toFixed(6)} ${v[1].toFixed(6)} ${v[2].toFixed(6)}\n`;
  }
  
  // UVs
  if (mesh.uvs) {
    obj += '\n';
    for (const uv of mesh.uvs) {
      obj += `vt ${uv[0].toFixed(6)} ${uv[1].toFixed(6)}\n`;
    }
  }
  
  // Normals
  if (mesh.normals) {
    obj += '\n';
    for (const n of mesh.normals) {
      obj += `vn ${n[0].toFixed(6)} ${n[1].toFixed(6)} ${n[2].toFixed(6)}\n`;
    }
  }
  
  // Faces
  obj += '\n';
  for (const f of mesh.faces) {
    if (mesh.uvs && mesh.normals) {
      obj += `f ${f[0]+1}/${f[0]+1}/${f[0]+1} ${f[1]+1}/${f[1]+1}/${f[1]+1} ${f[2]+1}/${f[2]+1}/${f[2]+1}\n`;
    } else {
      obj += `f ${f[0]+1} ${f[1]+1} ${f[2]+1}\n`;
    }
  }
  
  return obj;
}

// Get all generated games
app.get('/api/games', async (req, res) => {
  try {
    const entries = await fs.readdir(GAMES_DIR, { withFileTypes: true });
    const games = [];
    
    for (const entry of entries) {
      if (entry.isDirectory()) {
        try {
          const gameData = await fs.readFile(path.join(GAMES_DIR, entry.name, 'game.json'), 'utf8');
          const game = JSON.parse(gameData);
          games.push({
            id: game.id,
            title: game.spec.title,
            genre: game.spec.genre,
            setting: game.spec.setting,
            platform: game.spec.target_platform,
            style: game.spec.style,
            complexity: game.spec.complexity,
            assets: game.assets.length,
            scenes: game.scenes.length,
            generated_at: game.generated_at
          });
        } catch (err) {
          // Skip invalid entries
        }
      }
    }
    
    res.json({ games: games.sort((a, b) => new Date(b.generated_at) - new Date(a.generated_at)) });
  } catch (err) {
    res.json({ games: [] });
  }
});

// Download game package
app.get('/api/games/:id/download', async (req, res) => {
  const { id } = req.params;
  const gamePath = path.join(GAMES_DIR, id);
  
  try {
    // Check if game exists
    await fs.access(gamePath);
    
    // Create a simple zip-like response (in production, use proper zip library)
    const gameData = await fs.readFile(path.join(gamePath, 'game.json'), 'utf8');
    const game = JSON.parse(gameData);
    
    res.setHeader('Content-Disposition', `attachment; filename="${game.spec.title.replace(/\s+/g, '_')}.json"`);
    res.setHeader('Content-Type', 'application/json');
    res.send(gameData);
  } catch (err) {
    res.status(404).json({ error: 'Game not found' });
  }
});

// Get specific game details
app.get('/api/games/:id', async (req, res) => {
  const { id } = req.params;
  const gamePath = path.join(GAMES_DIR, id, 'game.json');
  
  try {
    const gameData = await fs.readFile(gamePath, 'utf8');
    res.json(JSON.parse(gameData));
  } catch (err) {
    res.status(404).json({ error: 'Game not found' });
  }
});

// Serve static files in production

// ── NEXUS ENGINE PROXY ────────────────────────────────────────
const NEXUS_URL = process.env.NEXUS_API_URL || 'http://localhost:8000';

app.post('/api/nexus/create', async (req, res) => {
  try {
    const r = await fetch(NEXUS_URL + '/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });
    const data = await r.json();
    res.json(data);
  } catch (err) {
    res.status(503).json({ error: 'NEXUS offline', fallback: true });
  }
});

app.post('/api/nexus/step', async (req, res) => {
  try {
    const r = await fetch(NEXUS_URL + '/step', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });
    const data = await r.json();
    res.json(data);
  } catch (err) {
    res.status(503).json({ error: 'NEXUS offline', fallback: true });
  }
});

app.get('/api/nexus/status', async (req, res) => {
  try {
    const r = await fetch(NEXUS_URL + '/status');
    const data = await r.json();
    res.json({ ...data, nexus_url: NEXUS_URL, online: true });
  } catch (err) {
    res.json({ online: false, fallback: true });
  }
});

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'dist')));
  
  app.get('/*splat', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🎮 NeuroForge Game Agency Server running on port ${PORT}`);
  console.log(`📊 API Status: http://localhost:${PORT}/api/status`);
});
