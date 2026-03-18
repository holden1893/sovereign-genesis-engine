export interface GameSpec {
  title: string;
  genre: string;
  style: string;
  setting: string;
  target_platform: string;
  player_count: number;
  complexity: string;
}

export interface GameDesign {
  core_mechanics: string[];
  art_direction: string;
  level_structure: {
    rooms: number;
    connections: string;
    size: string;
    estimated_playtime: string;
  };
  character_roles: Array<{
    role: string;
    type: string;
    count?: number;
    importance: string;
  }>;
  key_features: string[];
  narrative_outline?: string;
  progression_system?: {
    type: string;
    unlockables: string[];
    difficulty_scaling: boolean;
    new_game_plus: boolean;
  };
}

export interface Asset3D {
  name: string;
  asset_type: string;
  vertex_count: number;
  face_count: number;
  has_texture: boolean;
  has_animations: boolean;
  metadata: Record<string, any>;
}

export interface GameScene {
  name: string;
  asset_count: number;
  lighting: Record<string, any>;
  camera: Record<string, any>;
  physics: Record<string, any>;
  gameplay_logic: Record<string, any>;
  spawn_points: number[][];
}

export interface GameCode {
  player_controller: Record<string, any>;
  enemy_ai: Record<string, any>;
  game_manager: Record<string, any>;
  ui_system: Record<string, any>;
  physics_config: Record<string, any>;
  audio_system?: Record<string, any>;
}

export interface ExportConfig {
  platform: string;
  format: string;
  engine: string;
  file_structure: Record<string, string>;
  build_config: Record<string, any>;
  dependencies: string[];
}

export interface GamePackage {
  id: string;
  spec: GameSpec;
  design: GameDesign;
  assets: Asset3D[];
  scenes: GameScene[];
  code: GameCode;
  export_config: ExportConfig;
  generated_at: string;
}

export interface TrainingMetrics {
  iteration: number;
  avg_score: number;
  num_games: number;
}

export interface SystemStatus {
  total_params: string;
  games_generated: number;
  assets_created: number;
  scenes_composed: number;
  training_iterations: number;
  avg_quality_score: number;
}
