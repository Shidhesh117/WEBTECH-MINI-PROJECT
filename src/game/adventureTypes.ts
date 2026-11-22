export type AdventureScreen =
  | 'TITLE'
  | 'INTRO'
  | 'PLAYING'
  | 'LEVEL_TRANSITION'
  | 'PAUSED'
  | 'GAME_OVER'
  | 'VICTORY';

export type RoomId = 'classroom' | 'library' | 'robotics' | 'canteen' | 'auditorium' | 'gate';

export type AdventureDifficulty = 'chill' | 'standard' | 'spooky';

export type SpotlightColor = 'gold' | 'cyan' | 'rose';

export type ItemId =
  | 'torch'
  | 'folded_note'
  | 'classroom_key'
  | 'fuse'
  | 'torn_map'
  | 'card_frag_a'
  | 'plastic_gear'
  | 'mini_drone'
  | 'plastic_tray'
  | 'chai_flask'
  | 'card_frag_b'
  | 'grappling_rope'
  | 'security_keyring'
  | 'full_access_card';

export type PuzzleId =
  | 'classroom_code'
  | 'library_books'
  | 'robotics_circuit'
  | 'canteen_sequence'
  | 'auditorium_lights'
  | 'gate_code'
  | 'torn_map_view';

export type ZombieRole = 'student' | 'librarian' | 'labtech' | 'chef' | 'dj' | 'gatekeeper';

export type ZombieState = 'idle' | 'patrol' | 'alert' | 'approach' | 'distracted';

export interface RunConfig {
  classroomClues: [number, number, number];
  classroomCode: string;
  libraryOrder: ('oldest' | 'blue' | 'smallest' | 'heavy')[];
  circuitOrder: ('power' | 'servo' | 'signal')[];
  canteenOrder: ('dosa' | 'coffee' | 'samosa' | 'jamun')[];
  auditoriumColors: [SpotlightColor, SpotlightColor, SpotlightColor];
  gateCode: string;
  stickerSpots: Record<RoomId, { x: number; y: number }>;
}

export interface InventoryItemDef {
  id: ItemId;
  name: string;
  shortName: string;
  description: string;
  color: string;
}

export interface RoomHotspot {
  id: string;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  kind: 'inspect' | 'collect' | 'puzzle' | 'door' | 'hide' | 'hazard' | 'sticker';
  darkHidden?: boolean;
}

export interface RoomDefinition {
  id: RoomId;
  levelLabel: string;
  title: string;
  objective: string;
  introQuote: string;
  bgGradient: [string, string];
  zombieName: string;
  zombieRole: ZombieRole;
  zombiePatrolX: [number, number];
  zombieY: number;
  hotspots: RoomHotspot[];
  hints: string[];
}

export interface RoomZombieRuntime {
  roomId: RoomId;
  x: number;
  y: number;
  patrolDir: 1 | -1;
  state: ZombieState;
  stateTimer: number;
  bubble: string | null;
  bubbleTimer: number;
}

export interface PeerStudentRuntime {
  x: number;
  y: number;
  fleeing: boolean;
  bubble: string | null;
  bubbleTimer: number;
}

export interface CartoonParticle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  kind: 'spark' | 'dust' | 'star' | 'heart' | 'confetti';
  life: number;
  maxLife: number;
}

export interface SavedProgress {
  bestScore: number;
  bestTimeRemaining: number;
  completions: number;
  muted: boolean;
}
