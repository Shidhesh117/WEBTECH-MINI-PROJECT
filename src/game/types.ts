export type GamePhase = 'TITLE' | 'PLAYING' | 'PAUSED' | 'VICTORY' | 'GAME_OVER';

export type Difficulty = 'freshman' | 'senior' | 'nightmare';

export type EscapeRouteId = 'bus' | 'chopper' | 'tunnel' | 'glider';

export type WeaponId = 'bat' | 'nailgun' | 'tesla';

export type ZombieType = 'shambler' | 'sprinter' | 'brute' | 'spitter';

export interface Vec2 {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface CampusZone {
  id: string;
  name: string;
  shortName: string;
  x: number;
  y: number;
  w: number;
  h: number;
  floorColor: string;
  accentColor: string;
  isIndoor: boolean;
}

export interface WallObstacle extends Rect {
  kind: 'wall' | 'shelf' | 'bench' | 'pillar' | 'fence' | 'bus_hull';
  color?: string;
}

export interface StreetLamp {
  x: number;
  y: number;
  radius: number;
  color: string;
  flicker?: boolean;
}

export interface EscapeRoutePart {
  id: string;
  routeId: EscapeRouteId;
  name: string;
  locationHint: string;
  x: number;
  y: number;
  collected: boolean;
  color: string;
}

export interface EscapeRouteDefinition {
  id: EscapeRouteId;
  title: string;
  shortTitle: string;
  tagline: string;
  victoryTitle: string;
  victorySummary: string;
  extractionName: string;
  extractionX: number;
  extractionY: number;
  accentColor: string;
  partIds: string[];
}

export interface InteractiveStation {
  id: string;
  kind: 'locker' | 'chai' | 'coffee' | 'alarm' | 'weapon_crate';
  label: string;
  x: number;
  y: number;
  radius: number;
  cooldown: number;
  maxCooldown: number;
  usedOnce: boolean;
  rewardWeapon?: WeaponId;
}

export interface HumanNpc {
  id: string;
  name: string;
  role: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  angle: number;
  hp: number;
  maxHp: number;
  rescued: boolean;
  isStationaryVendor?: boolean;
  shirtColor: string;
  hairColor: string;
  skinColor: string;
  speech: string | null;
  speechTimer: number;
  fireCooldown: number;
  hitFlash: number;
}

export interface ExplosiveBarrel {
  id: string;
  x: number;
  y: number;
  radius: number;
  hp: number;
  maxHp: number;
  exploded: boolean;
  hitFlash: number;
}

export interface PickupDrop {
  id: string;
  kind: 'medkit' | 'ammo' | 'battery' | 'decoy';
  x: number;
  y: number;
  amount: number;
  bobPhase: number;
  life: number;
}

export interface ZombieEntity {
  id: number;
  type: ZombieType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  hp: number;
  maxHp: number;
  speed: number;
  damage: number;
  angle: number;
  hitFlash: number;
  squash: number;
  state: 'chase' | 'windup' | 'lunge' | 'slam' | 'spit_windup' | 'cooldown';
  stateTimer: number;
  attackCooldown: number;
  targetX: number;
  targetY: number;
}

export interface Projectile {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  damage: number;
  fromPlayer: boolean;
  kind: 'nail' | 'tesla_bolt' | 'acid' | 'ally_shot';
  life: number;
  pierce: number;
  color: string;
}

export interface AcidPool {
  x: number;
  y: number;
  radius: number;
  life: number;
  maxLife: number;
}

export interface DecoyEntity {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  ringTimer: number;
}

export interface Particle {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
  drag: number;
}

export interface FloatingText {
  x: number;
  y: number;
  vy: number;
  text: string;
  color: string;
  life: number;
  maxLife: number;
  scale: number;
}

export interface LightningArc {
  points: Vec2[];
  life: number;
  maxLife: number;
}

export interface MiniGameState {
  active: boolean;
  routeId: EscapeRouteId;
  title: string;
  subtitle: string;
  sequence?: ('W' | 'A' | 'S' | 'D')[];
  sequenceIndex?: number;
  circuitOrder?: number[];
  circuitStep?: number;
  chargeProgress?: number;
}

export interface MinimapBlip {
  x: number;
  y: number;
  kind: 'part' | 'extraction' | 'alarm' | 'chai' | 'zombie' | 'human';
  color: string;
}

export interface HudSnapshot {
  phase: GamePhase;
  difficulty: Difficulty;
  hp: number;
  maxHp: number;
  stamina: number;
  maxStamina: number;
  speedBoostTimer: number;
  elapsedSeconds: number;
  kills: number;
  score: number;
  waveLevel: number;
  survivorsRescued: number;
  totalSurvivors: number;
  autoAim: boolean;
  currentZoneName: string;
  activeWeapon: WeaponId;
  unlockedWeapons: Record<WeaponId, boolean>;
  nailAmmo: number;
  nailMag: number;
  nailMaxMag: number;
  teslaEnergy: number;
  teslaMaxEnergy: number;
  reloadingTimer: number;
  decoys: number;
  trackedRoute: EscapeRouteId;
  routeProgress: Record<
    EscapeRouteId,
    {
      collected: number;
      total: number;
      ready: boolean;
      partNames: { id: string; name: string; locationHint: string; collected: boolean }[];
    }
  >;
  targetDirectionAngle: number | null;
  targetDistanceMeters: number | null;
  targetLabel: string;
  contextPrompt: string | null;
  chopperHoldoutActive: boolean;
  chopperHoldoutRemaining: number;
  activeAlarmZone: string | null;
  activeAlarmRemaining: number;
  miniGame: MiniGameState | null;
  bannerMessage: string | null;
  victoryRoute: EscapeRouteId | null;
  barrelsDetonated: number;
  playerX: number;
  playerY: number;
  worldW: number;
  worldH: number;
  minimapBlips: MinimapBlip[];
}
