// Client-side game generation (no backend required)
import type { GameSpec, GamePackage, GameDesign, Asset3D, GameScene, GameCode, ExportConfig } from '@/types/game';

// Template-based game design generation
export function generateTemplateDesign(spec: GameSpec): GameDesign {
  const mechanics: Record<string, string[]> = {
    fps: ['shooting', 'movement', 'aiming', 'health_system', 'cover_system', 'weapon_switching', 'reload_system', 'headshots'],
    rpg: ['quest_system', 'inventory', 'leveling', 'dialogue', 'skill_trees', 'fast_travel', 'crafting', 'equipment'],
    platformer: ['jumping', 'running', 'collecting', 'enemy_avoidance', 'power_ups', 'wall_jump', 'double_jump', 'speed_run'],
    survival: ['resource_gathering', 'crafting', 'hunger', 'shelter', 'day_night_cycle', 'base_building', 'farming', 'taming'],
    racing: ['driving', 'boosting', 'drifting', 'race_positions', 'vehicle_customization', 'time_trials', 'tournaments'],
    puzzle: ['block_manipulation', 'pattern_matching', 'time_pressure', 'hint_system', 'scoring', 'leaderboards']
  };
  
  const narratives: Record<string, Record<string, string>> = {
    'sci-fi': {
      fps: 'In a dystopian cyberpunk future, you are a rogue agent fighting against a corrupt megacorporation that controls the city.',
      rpg: 'As a space explorer, you discover an ancient alien artifact that grants mysterious powers and attracts dangerous enemies.',
      platformer: 'A malfunctioning robot must navigate through a massive space station to find its creator and prevent a catastrophic failure.',
      survival: 'Stranded on an alien planet, you must use advanced technology to survive the hostile environment and find a way home.',
      racing: 'Pilot high-speed anti-gravity ships through neon-lit cityscapes in the galaxy\'s most dangerous racing league.',
      puzzle: 'Hack into a rogue AI system by solving complex logic puzzles to prevent a global cyber catastrophe.'
    },
    'fantasy': {
      fps: 'An arcane marksman uses enchanted firearms to hunt down dark creatures threatening the realm.',
      rpg: 'A chosen hero must unite the fractured kingdoms against an ancient evil awakening from its thousand-year slumber.',
      platformer: 'A young wizard apprentice jumps through magical realms to collect spell components and defeat an evil sorcerer.',
      survival: 'Banished to a cursed wilderness, you must master ancient magic and tame mythical beasts to survive.',
      racing: 'Ride magical creatures through enchanted forests and floating islands in the realm\'s grand championship.',
      puzzle: 'Restore balance to the magical world by solving ancient riddles left by the first wizards.'
    },
    'modern': {
      fps: 'An elite special forces operative takes on a global terrorist organization threatening world peace.',
      rpg: 'A detective discovers a conspiracy that spans the city\'s criminal underworld and corrupt government.',
      platformer: 'A parkour runner navigates the urban landscape to deliver important messages while evading capture.',
      survival: 'After a natural disaster, survivors must work together to rebuild their community amidst scarce resources.',
      racing: 'Compete in underground street racing circuits to become the city\'s most legendary driver.',
      puzzle: 'Uncover corporate secrets by hacking security systems through intricate puzzle challenges.'
    },
    'post-apocalyptic': {
      fps: 'A wasteland mercenary fights for survival and resources in a world devastated by nuclear war.',
      rpg: 'The last guardian of ancient knowledge must protect it from raiders while searching for a way to restore civilization.',
      platformer: 'A mutated creature navigates the ruins of a fallen civilization to find the source of the contamination.',
      survival: 'In a world where resources are scarce, factions war over the last habitable territories.',
      racing: 'Race through the wasteland in makeshift vehicles, scavenging parts and fighting off raiders.',
      puzzle: 'Reactivate ancient technology by solving puzzles left by the pre-war civilization.'
    },
    'historical': {
      fps: 'A skilled archer defends their kingdom against invading forces in medieval warfare.',
      rpg: 'Navigate the political intrigue of ancient empires as a rising leader.',
      platformer: 'An acrobat performs daring feats through historical landmarks and ancient ruins.',
      survival: 'Lead a colony of settlers through harsh winters and scarce resources in the new world.',
      racing: 'Compete in ancient chariot races through the grand colosseums of the past.',
      puzzle: 'Decode ancient manuscripts and solve historical mysteries to uncover lost treasures.'
    }
  };
  
  const levelStructures: Record<string, any> = {
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

// Generate 3D mesh procedurally
function generateMesh(assetType: string) {
  const vertices: number[][] = [];
  const faces: number[][] = [];
  const uvs: number[][] = [];
  const normals: number[][] = [];
  
  const complexity = assetType === 'character' ? 500 : assetType === 'enemy' ? 400 : 100;
  
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
  
  for (let i = 0; i < complexity - 2; i++) {
    faces.push([i, i + 1, i + 2]);
  }
  
  return { vertices, faces, uvs, normals };
}

// Generate assets
function generateAssets(spec: GameSpec): Asset3D[] {
  const numEnemies = spec.complexity === 'simple' ? 3 : spec.complexity === 'medium' ? 5 : 8;
  const assets: Asset3D[] = [];
  
  // Player
  const playerMesh = generateMesh('character');
  assets.push({
    name: 'player',
    asset_type: 'character',
    vertex_count: playerMesh.vertices.length,
    face_count: playerMesh.faces.length,
    has_texture: true,
    has_animations: true,
    metadata: { mesh: playerMesh }
  });
  
  // Enemies
  for (let i = 0; i < numEnemies; i++) {
    const enemyMesh = generateMesh('enemy');
    assets.push({
      name: `enemy_${i}`,
      asset_type: 'enemy',
      vertex_count: enemyMesh.vertices.length,
      face_count: enemyMesh.faces.length,
      has_texture: true,
      has_animations: true,
      metadata: { mesh: enemyMesh }
    });
  }
  
  // Props
  const propTypes = spec.setting === 'sci-fi' 
    ? ['crate', 'console', 'barrier', 'turret', 'vehicle']
    : spec.setting === 'fantasy'
    ? ['crate', 'barrel', 'rock', 'tree', 'ruins', 'chest']
    : ['crate', 'barrel', 'rock', 'tree', 'building', 'vehicle'];
  
  for (const propType of propTypes) {
    const propMesh = generateMesh('prop');
    assets.push({
      name: propType,
      asset_type: 'prop',
      vertex_count: propMesh.vertices.length,
      face_count: propMesh.faces.length,
      has_texture: true,
      has_animations: false,
      metadata: { mesh: propMesh }
    });
  }
  
  // Weapons
  if (spec.genre !== 'platformer' && spec.genre !== 'puzzle') {
    const weaponTypes = spec.setting === 'fantasy' 
      ? ['sword', 'bow', 'staff']
      : ['pistol', 'rifle', 'melee'];
    
    for (const weaponType of weaponTypes) {
      const weaponMesh = generateMesh('weapon');
      assets.push({
        name: weaponType,
        asset_type: 'weapon',
        vertex_count: weaponMesh.vertices.length,
        face_count: weaponMesh.faces.length,
        has_texture: true,
        has_animations: false,
        metadata: { mesh: weaponMesh }
      });
    }
  }
  
  return assets;
}

// Generate lighting config
function generateLighting(setting: string) {
  const configs: Record<string, any> = {
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
    },
    'historical': {
      ambient: [0.25, 0.25, 0.2],
      directional: { color: [1.0, 0.95, 0.8], direction: [-0.4, -1.0, -0.2], intensity: 1.0 },
      point_lights: [{ color: [0.9, 0.6, 0.3], position: [2, 2, 2], intensity: 1.2 }]
    }
  };
  return configs[setting] || configs.modern;
}

// Generate camera config
function generateCamera(genre: string) {
  const cameras: Record<string, any> = {
    fps: { type: 'first_person', fov: 75, near: 0.01, far: 1000.0 },
    tps: { type: 'third_person', fov: 60, near: 0.1, far: 1000.0, distance: 5.0 },
    platformer: { type: 'side_scrolling', fov: 50, near: 0.1, far: 500.0 },
    rpg: { type: 'third_person', fov: 65, near: 0.1, far: 2000.0, distance: 7.0 },
    survival: { type: 'first_person', fov: 70, near: 0.01, far: 1500.0 },
    racing: { type: 'chase_camera', fov: 80, near: 0.1, far: 2000.0, distance: 8.0 }
  };
  return cameras[genre] || cameras.fps;
}

// Generate physics config
function generatePhysics(genre: string) {
  return {
    gravity: [0, -9.81, 0],
    collision_system: genre === 'fps' || genre === 'tps' ? 'mesh' : 'aabb',
    ragdoll: genre === 'fps' || genre === 'action',
    destructible: genre === 'fps' || genre === 'action' || genre === 'survival',
    time_scale: 1.0,
    solver_iterations: 8
  };
}

// Generate objectives
function generateObjectives(genre: string): string[] {
  const objectives: Record<string, string[]> = {
    fps: ['eliminate_targets', 'reach_extraction', 'defend_position'],
    rpg: ['complete_quest', 'defeat_boss', 'explore_area'],
    platformer: ['reach_goal', 'collect_items', 'avoid_obstacles'],
    survival: ['survive_waves', 'gather_resources', 'craft_items'],
    racing: ['finish_first', 'beat_time', 'collect_powerups'],
    puzzle: ['solve_puzzle', 'reach_exit', 'collect_all_pieces']
  };
  return objectives[genre] || ['reach_goal'];
}

// Generate scenes
function generateScenes(spec: GameSpec, assets: Asset3D[]): GameScene[] {
  const numScenes = spec.complexity === 'complex' ? 3 : 1;
  const scenes: GameScene[] = [];
  
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
  
  return scenes;
}

// Generate gameplay logic
function generateGameplayLogic(spec: GameSpec): GameCode {
  const controllers: Record<string, any> = {
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
    },
    racing: {
      acceleration: 8.0,
      max_speed: 50.0,
      handling: 0.7,
      input_mapping: {
        accelerate: 'W', brake: 'S', steer_left: 'A', steer_right: 'D',
        boost: 'Shift', drift: 'Space'
      }
    },
    puzzle: {
      input_mapping: {
        select: 'Mouse0', rotate: 'R', undo: 'Z', hint: 'H'
      }
    }
  };
  
  const aiConfigs: Record<string, any> = {
    simple: { behaviors: ['idle', 'chase'], detection_range: 10.0, attack_range: 2.0, health: 50, damage: 5 },
    medium: { behaviors: ['patrol', 'chase', 'attack', 'retreat'], detection_range: 15.0, attack_range: 2.0, health: 100, damage: 10, patrol_points: 4 },
    complex: { behaviors: ['patrol', 'investigate', 'chase', 'attack', 'retreat', 'flank'], detection_range: 20.0, attack_range: 2.5, health: 150, damage: 15, patrol_points: 6, group_tactics: true }
  };
  
  const achievements: Record<string, any[]> = {
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
    ],
    racing: [
      { id: 'first_win', name: 'First Victory', description: 'Win your first race' },
      { id: 'speed_demon', name: 'Speed Demon', description: 'Reach top speed' },
      { id: 'champion', name: 'Champion', description: 'Win a tournament' }
    ],
    puzzle: [
      { id: 'first_solve', name: 'Problem Solver', description: 'Solve your first puzzle' },
      { id: 'speed_solver', name: 'Speed Solver', description: 'Solve a puzzle in under 30 seconds' },
      { id: 'master', name: 'Puzzle Master', description: 'Complete all puzzles' }
    ]
  };
  
  const hudElements: Record<string, string[]> = {
    fps: ['health_bar', 'ammo_count', 'minimap', 'crosshair', 'weapon_icon', 'grenade_count'],
    rpg: ['health_bar', 'mana_bar', 'minimap', 'quest_log', 'inventory_button', 'skill_bar'],
    platformer: ['health_bar', 'score', 'lives', 'powerup_indicator', 'coin_count'],
    survival: ['health_bar', 'hunger_bar', 'thirst_bar', 'stamina_bar', 'temperature'],
    racing: ['speedometer', 'position', 'lap_counter', 'boost_meter', 'minimap'],
    puzzle: ['score', 'timer', 'moves', 'hint_button']
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
      achievements: achievements[spec.genre] || []
    },
    ui_system: {
      hud_elements: hudElements[spec.genre] || ['health_bar'],
      menus: ['main_menu', 'pause_menu', 'settings', 'credits'],
      font: 'default',
      color_scheme: spec.setting === 'sci-fi' || spec.setting === 'post-apocalyptic' ? 'dark' : 'light'
    },
    physics_config: generatePhysics(spec.genre)
  };
}

// Generate export config
function generateExportConfig(spec: GameSpec): ExportConfig {
  const formats: Record<string, string> = { pc: 'exe/dll', console: 'pkg', mobile: 'apk/ipa', web: 'wasm/js' };
  const buildConfigs: Record<string, any> = {
    pc: { target_architecture: 'x64', graphics_api: 'DirectX 12 / Vulkan', resolution: '1920x1080', frame_rate: 60, windowed: true },
    console: { target_architecture: 'x64', graphics_api: 'Proprietary', resolution: '4K', frame_rate: 60, hdr: true },
    mobile: { target_architecture: 'ARM64', graphics_api: 'OpenGL ES / Vulkan', resolution: 'Adaptive', frame_rate: 30, touch_controls: true },
    web: { target_architecture: 'wasm', graphics_api: 'WebGL 2.0', resolution: 'Adaptive', frame_rate: 60 }
  };
  const deps: Record<string, string[]> = {
    pc: ['DirectX Runtime', 'Visual C++ Redistributable'],
    console: ['Console SDK', 'Certification Tools'],
    mobile: ['Android SDK / Xcode', 'Gradle / CocoaPods'],
    web: ['WebGL 2.0 Compatible Browser']
  };
  
  return {
    platform: spec.target_platform,
    format: formats[spec.target_platform] || 'zip',
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
    build_config: buildConfigs[spec.target_platform] || buildConfigs.pc,
    dependencies: deps[spec.target_platform] || []
  };
}

// Main game generation function (client-side)
export function generateGame(spec: GameSpec): GamePackage {
  const gameId = `game_${Date.now()}`;
  
  // Generate all components
  const design = generateTemplateDesign(spec);
  const assets = generateAssets(spec);
  const scenes = generateScenes(spec, assets);
  const code = generateGameplayLogic(spec);
  const exportConfig = generateExportConfig(spec);
  
  return {
    id: gameId,
    spec,
    design,
    assets,
    scenes,
    code,
    export_config: exportConfig,
    generated_at: new Date().toISOString()
  };
}

// Convert mesh to OBJ format
export function convertToOBJ(asset: Asset3D): string {
  const mesh = asset.metadata?.mesh;
  if (!mesh) return `# No mesh data for ${asset.name}`;
  
  let obj = `# ${asset.name}\n# Generated by NeuroForge Game Agency\n\n`;
  
  for (const v of mesh.vertices) {
    obj += `v ${v[0].toFixed(6)} ${v[1].toFixed(6)} ${v[2].toFixed(6)}\n`;
  }
  
  if (mesh.uvs?.length) {
    obj += '\n';
    for (const uv of mesh.uvs) {
      obj += `vt ${uv[0].toFixed(6)} ${uv[1].toFixed(6)}\n`;
    }
  }
  
  if (mesh.normals?.length) {
    obj += '\n';
    for (const n of mesh.normals) {
      obj += `vn ${n[0].toFixed(6)} ${n[1].toFixed(6)} ${n[2].toFixed(6)}\n`;
    }
  }
  
  obj += '\n';
  for (const f of mesh.faces) {
    if (mesh.uvs?.length && mesh.normals?.length) {
      obj += `f ${f[0]+1}/${f[0]+1}/${f[0]+1} ${f[1]+1}/${f[1]+1}/${f[1]+1} ${f[2]+1}/${f[2]+1}/${f[2]+1}\n`;
    } else {
      obj += `f ${f[0]+1} ${f[1]+1} ${f[2]+1}\n`;
    }
  }
  
  return obj;
}

// Download game package
export function downloadGame(game: GamePackage) {
  const blob = new Blob([JSON.stringify(game, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${game.spec.title.replace(/\s+/g, '_')}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
