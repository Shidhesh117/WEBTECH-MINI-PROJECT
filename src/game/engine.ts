import { soundEngine } from './audio';
import {
  CAMPUS_ZONES,
  createCampusWalls,
  createExplosiveBarrels,
  createHumanNpcs,
  createInitialParts,
  createInteractiveStations,
  createStreetLamps,
  ESCAPE_ROUTES,
  WORLD_HEIGHT,
  WORLD_WIDTH,
} from './campusMap';
import {
  AcidPool,
  DecoyEntity,
  Difficulty,
  EscapeRouteId,
  EscapeRoutePart,
  ExplosiveBarrel,
  FloatingText,
  GamePhase,
  HudSnapshot,
  HumanNpc,
  InteractiveStation,
  LightningArc,
  MiniGameState,
  MinimapBlip,
  Particle,
  PickupDrop,
  Projectile,
  StreetLamp,
  Vec2,
  WallObstacle,
  WeaponId,
  ZombieEntity,
  ZombieType,
} from './types';

const DIFFICULTY_CFG: Record<
  Difficulty,
  { spawnInterval: number; maxZombies: number; zombieHpMult: number; zombieDmgMult: number; startNails: number }
> = {
  freshman: { spawnInterval: 2.3, maxZombies: 28, zombieHpMult: 0.85, zombieDmgMult: 0.78, startNails: 72 },
  senior: { spawnInterval: 1.75, maxZombies: 38, zombieHpMult: 1.0, zombieDmgMult: 1.0, startNails: 54 },
  nightmare: { spawnInterval: 1.3, maxZombies: 50, zombieHpMult: 1.25, zombieDmgMult: 1.28, startNails: 40 },
};

const MAX_PARTICLES = 360;

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private lightCanvas: HTMLCanvasElement;
  private lightCtx: CanvasRenderingContext2D;
  private onHudUpdate: (snapshot: HudSnapshot) => void;

  private rafId: number | null = null;
  private lastTimestamp = 0;
  private hudSyncTimer = 0;

  // Viewport & camera
  private viewW = 1280;
  private viewH = 720;
  private dpr = 1;
  private camX = 1200;
  private camY = 900;
  private shakeTimer = 0;
  private shakeIntensity = 0;
  private hitstopTimer = 0;

  // Game state
  private phase: GamePhase = 'TITLE';
  private difficulty: Difficulty = 'senior';
  private elapsedSeconds = 0;
  private kills = 0;
  private score = 0;
  private barrelsDetonated = 0;
  private victoryRoute: EscapeRouteId | null = null;

  // World
  private walls: WallObstacle[] = createCampusWalls();
  private lamps: StreetLamp[] = createStreetLamps();
  private parts: EscapeRoutePart[] = createInitialParts();
  private stations: InteractiveStation[] = createInteractiveStations();
  private barrels: ExplosiveBarrel[] = createExplosiveBarrels();
  private npcs: HumanNpc[] = createHumanNpcs();
  private autoAim = true;

  // Player
  private player = {
    x: 1200,
    y: 1030,
    vx: 0,
    vy: 0,
    radius: 16,
    angle: -Math.PI / 2,
    hp: 100,
    maxHp: 100,
    stamina: 100,
    maxStamina: 100,
    speedBoostTimer: 0,
    invulnTimer: 0,
    hitFlash: 0,
    squash: 1,
    activeWeapon: 'nailgun' as WeaponId,
    unlockedWeapons: { bat: true, nailgun: true, tesla: false } as Record<WeaponId, boolean>,
    nailMag: 18,
    nailMaxMag: 18,
    nailAmmo: 54,
    nailOverclocked: false,
    teslaEnergy: 0,
    teslaMaxEnergy: 40,
    reloadingTimer: 0,
    fireCooldown: 0,
    batSwingTimer: 0,
    batSwingDir: 1,
    decoys: 3,
  };

  // Entities
  private nextZombieId = 1;
  private zombies: ZombieEntity[] = [];
  private projectiles: Projectile[] = [];
  private acidPools: AcidPool[] = [];
  private decoys: DecoyEntity[] = [];
  private drops: PickupDrop[] = [];
  private particles: Particle[] = [];
  private floatingTexts: FloatingText[] = [];
  private lightningArcs: LightningArc[] = [];

  // Spawning & Extraction
  private spawnTimer = 1.0;
  private trackedRoute: EscapeRouteId = 'bus';
  private chopperHoldoutActive = false;
  private chopperHoldoutRemaining = 18;
  private activeAlarmZone: string | null = null;
  private activeAlarmPos: Vec2 | null = null;
  private activeAlarmRemaining = 0;
  private bannerMessage: string | null = null;
  private bannerTimer = 0;
  private miniGame: MiniGameState | null = null;

  // Input
  private heldKeys = new Set<string>();
  private justPressedKeys = new Set<string>();
  private mouseScreen: Vec2 = { x: 640, y: 360 };
  private mouseDown = false;
  private mouseJustPressed = false;
  private rightMouseJustPressed = false;

  constructor(canvas: HTMLCanvasElement, onHudUpdate: (snapshot: HudSnapshot) => void) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Could not initialize 2D canvas context');
    }
    this.ctx = ctx;

    this.lightCanvas = document.createElement('canvas');
    const lctx = this.lightCanvas.getContext('2d');
    if (!lctx) {
      throw new Error('Could not initialize lightmap context');
    }
    this.lightCtx = lctx;
    this.onHudUpdate = onHudUpdate;

    for (let i = 0; i < MAX_PARTICLES; i++) {
      this.particles.push({
        active: false,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        size: 3,
        color: '#fff',
        alpha: 1,
        life: 0,
        maxLife: 1,
        drag: 0.94,
      });
    }

    this.handleResize();
    this.attachListeners();
    this.resetWorld('senior', 'TITLE');
    this.startLoop();
  }

  private attachListeners(): void {
    window.addEventListener('resize', this.handleResize);
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('blur', this.handleBlur);
    this.canvas.addEventListener('mousemove', this.handleMouseMove);
    this.canvas.addEventListener('mousedown', this.handleMouseDown);
    window.addEventListener('mouseup', this.handleMouseUp);
    this.canvas.addEventListener('contextmenu', this.handleContextMenu);
  }

  destroy(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
    }
    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('blur', this.handleBlur);
    this.canvas.removeEventListener('mousemove', this.handleMouseMove);
    this.canvas.removeEventListener('mousedown', this.handleMouseDown);
    window.removeEventListener('mouseup', this.handleMouseUp);
    this.canvas.removeEventListener('contextmenu', this.handleContextMenu);
  }

  private handleResize = (): void => {
    const rect = this.canvas.parentElement?.getBoundingClientRect();
    this.viewW = Math.max(320, Math.floor(rect?.width ?? window.innerWidth));
    this.viewH = Math.max(320, Math.floor(rect?.height ?? window.innerHeight));
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);

    this.canvas.width = Math.floor(this.viewW * this.dpr);
    this.canvas.height = Math.floor(this.viewH * this.dpr);
    this.canvas.style.width = `${this.viewW}px`;
    this.canvas.style.height = `${this.viewH}px`;

    // Half-res lightmap for crisp fast performance
    this.lightCanvas.width = Math.max(160, Math.floor(this.viewW * 0.5));
    this.lightCanvas.height = Math.max(160, Math.floor(this.viewH * 0.5));
  };

  private handleKeyDown = (e: KeyboardEvent): void => {
    const code = e.code;
    if (['Space', 'Tab', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(code)) {
      if (this.phase === 'PLAYING') {
        e.preventDefault();
      }
    }
    if (!this.heldKeys.has(code)) {
      this.justPressedKeys.add(code);
    }
    this.heldKeys.add(code);
  };

  private handleKeyUp = (e: KeyboardEvent): void => {
    this.heldKeys.delete(e.code);
  };

  private handleBlur = (): void => {
    this.heldKeys.clear();
    this.mouseDown = false;
  };

  private handleMouseMove = (e: MouseEvent): void => {
    const rect = this.canvas.getBoundingClientRect();
    this.mouseScreen.x = e.clientX - rect.left;
    this.mouseScreen.y = e.clientY - rect.top;
  };

  private handleMouseDown = (e: MouseEvent): void => {
    if (e.button === 0) {
      this.mouseDown = true;
      this.mouseJustPressed = true;
    } else if (e.button === 2) {
      this.rightMouseJustPressed = true;
    }
  };

  private handleMouseUp = (e: MouseEvent): void => {
    if (e.button === 0) {
      this.mouseDown = false;
    }
  };

  private handleContextMenu = (e: MouseEvent): void => {
    e.preventDefault();
  };

  // Public API for React UI
  startGame(difficulty: Difficulty): void {
    this.resetWorld(difficulty, 'PLAYING');
    this.showBanner('Rescue friends, grab escape parts, and get out of BMSIT!', 4.2);
    soundEngine.playEscapeStart();
    this.emitHud();
  }

  toggleAutoAim(): boolean {
    this.autoAim = !this.autoAim;
    this.showBanner(`Easy Aim ${this.autoAim ? 'ON' : 'OFF'}`, 1.8);
    this.emitHud();
    return this.autoAim;
  }

  togglePause(): void {
    if (this.phase === 'PLAYING') {
      this.phase = 'PAUSED';
      this.heldKeys.clear();
      this.mouseDown = false;
      this.emitHud();
    } else if (this.phase === 'PAUSED') {
      this.phase = 'PLAYING';
      this.emitHud();
    }
  }

  returnToTitle(): void {
    this.resetWorld(this.difficulty, 'TITLE');
    this.emitHud();
  }

  setTrackedRoute(routeId: EscapeRouteId): void {
    this.trackedRoute = routeId;
    this.showBanner(`Tracking: ${ESCAPE_ROUTES[routeId].title}`, 2.6);
    this.emitHud();
  }

  cycleTrackedRoute(): void {
    const order: EscapeRouteId[] = ['bus', 'chopper', 'tunnel', 'glider'];
    const idx = order.indexOf(this.trackedRoute);
    const next = order[(idx + 1) % order.length];
    this.setTrackedRoute(next);
  }

  selectWeapon(weapon: WeaponId): void {
    if (!this.player.unlockedWeapons[weapon]) return;
    if (this.player.activeWeapon !== weapon) {
      this.player.activeWeapon = weapon;
      this.player.reloadingTimer = 0;
      this.emitHud();
    }
  }

  handleMiniGameInput(input: string): void {
    if (!this.miniGame || !this.miniGame.active || this.phase !== 'PLAYING') return;
    const mg = this.miniGame;

    if (mg.routeId === 'bus' && mg.sequence && mg.sequenceIndex !== undefined) {
      const expected = mg.sequence[mg.sequenceIndex];
      if (input.toUpperCase() === expected) {
        mg.sequenceIndex++;
        soundEngine.playPuzzleTap(true);
        if (mg.sequenceIndex >= mg.sequence.length) {
          this.triggerVictory('bus');
        }
      } else {
        mg.sequenceIndex = 0;
        soundEngine.playPuzzleTap(false);
        this.addFloatingText(this.player.x, this.player.y - 26, 'Sparked! Retry sequence', '#f87171');
      }
      this.emitHud();
    } else if (mg.routeId === 'tunnel' && mg.circuitOrder && mg.circuitStep !== undefined) {
      const num = Number(input);
      const expected = mg.circuitOrder[mg.circuitStep];
      if (num === expected) {
        mg.circuitStep++;
        soundEngine.playPuzzleTap(true);
        if (mg.circuitStep >= mg.circuitOrder.length) {
          this.triggerVictory('tunnel');
        }
      } else {
        mg.circuitStep = 0;
        soundEngine.playPuzzleTap(false);
        this.addFloatingText(this.player.x, this.player.y - 26, 'Circuit Short! Reset', '#f87171');
      }
      this.emitHud();
    } else if (mg.routeId === 'glider' && mg.chargeProgress !== undefined) {
      if (input === 'PUMP') {
        mg.chargeProgress = Math.min(100, mg.chargeProgress + 25);
        soundEngine.playPuzzleTap(true);
        this.spawnBurst(this.player.x, this.player.y, '#fbbf24', 8, 120);
        if (mg.chargeProgress >= 100) {
          this.triggerVictory('glider');
        }
        this.emitHud();
      }
    }
  }

  cancelMiniGame(): void {
    if (this.miniGame) {
      this.miniGame = null;
      this.emitHud();
    }
  }

  private resetWorld(difficulty: Difficulty, targetPhase: GamePhase): void {
    this.difficulty = difficulty;
    const cfg = DIFFICULTY_CFG[difficulty];
    this.phase = targetPhase;
    this.elapsedSeconds = 0;
    this.kills = 0;
    this.score = 0;
    this.barrelsDetonated = 0;
    this.victoryRoute = null;

    this.walls = createCampusWalls();
    this.lamps = createStreetLamps();
    this.parts = createInitialParts();
    this.stations = createInteractiveStations();
    this.barrels = createExplosiveBarrels();
    this.npcs = createHumanNpcs();

    this.player = {
      x: 1200,
      y: 1030,
      vx: 0,
      vy: 0,
      radius: 16,
      angle: -Math.PI / 2,
      hp: 100,
      maxHp: 100,
      stamina: 100,
      maxStamina: 100,
      speedBoostTimer: 0,
      invulnTimer: 0,
      hitFlash: 0,
      squash: 1,
      activeWeapon: 'nailgun',
      unlockedWeapons: { bat: true, nailgun: true, tesla: false },
      nailMag: 18,
      nailMaxMag: 18,
      nailAmmo: cfg.startNails,
      nailOverclocked: false,
      teslaEnergy: 0,
      teslaMaxEnergy: 40,
      reloadingTimer: 0,
      fireCooldown: 0,
      batSwingTimer: 0,
      batSwingDir: 1,
      decoys: 3,
    };

    this.camX = this.player.x;
    this.camY = this.player.y;
    this.shakeTimer = 0;
    this.shakeIntensity = 0;
    this.hitstopTimer = 0;

    this.zombies = [];
    this.projectiles = [];
    this.acidPools = [];
    this.decoys = [];
    this.drops = [];
    this.floatingTexts = [];
    this.lightningArcs = [];
    for (const p of this.particles) p.active = false;

    this.spawnTimer = 1.2;
    this.trackedRoute = 'bus';
    this.chopperHoldoutActive = false;
    this.chopperHoldoutRemaining = 18;
    this.activeAlarmZone = null;
    this.activeAlarmPos = null;
    this.activeAlarmRemaining = 0;
    this.bannerMessage = null;
    this.bannerTimer = 0;
    this.miniGame = null;

    // Seed initial campus zombies away from player spawn
    if (targetPhase === 'PLAYING') {
      for (let i = 0; i < 12; i++) {
        this.spawnZombie(true);
      }
    }
  }

  private startLoop(): void {
    this.lastTimestamp = performance.now();
    const tick = (now: number) => {
      const rawDt = (now - this.lastTimestamp) / 1000;
      this.lastTimestamp = now;
      const dt = Math.min(Math.max(rawDt, 0), 0.05);

      this.update(dt);
      this.render();

      this.justPressedKeys.clear();
      this.mouseJustPressed = false;
      this.rightMouseJustPressed = false;

      this.rafId = requestAnimationFrame(tick);
    };
    this.rafId = requestAnimationFrame(tick);
  }

  private update(dt: number): void {
    if (this.justPressedKeys.has('Escape') || this.justPressedKeys.has('KeyP')) {
      if (this.miniGame?.active) {
        this.cancelMiniGame();
      } else if (this.phase === 'PLAYING' || this.phase === 'PAUSED') {
        this.togglePause();
      }
    }

    if (this.phase === 'TITLE') {
      // Gentle atmospheric campus camera pan on title background
      const t = performance.now() * 0.00025;
      this.camX = 1200 + Math.cos(t) * 260;
      this.camY = 920 + Math.sin(t * 0.8) * 180;
      return;
    }

    if (this.phase !== 'PLAYING') {
      this.updateParticlesAndText(dt);
      return;
    }

    if (this.hitstopTimer > 0) {
      this.hitstopTimer -= dt;
      this.updateCameraShake(dt);
      return;
    }

    this.elapsedSeconds += dt;
    if (this.bannerTimer > 0) {
      this.bannerTimer -= dt;
      if (this.bannerTimer <= 0) this.bannerMessage = null;
    }

    // MiniGame keyboard shortcuts
    if (this.miniGame?.active) {
      if (this.miniGame.routeId === 'bus') {
        if (this.justPressedKeys.has('KeyW') || this.justPressedKeys.has('ArrowUp')) this.handleMiniGameInput('W');
        if (this.justPressedKeys.has('KeyA') || this.justPressedKeys.has('ArrowLeft')) this.handleMiniGameInput('A');
        if (this.justPressedKeys.has('KeyS') || this.justPressedKeys.has('ArrowDown')) this.handleMiniGameInput('S');
        if (this.justPressedKeys.has('KeyD') || this.justPressedKeys.has('ArrowRight')) this.handleMiniGameInput('D');
      } else if (this.miniGame.routeId === 'tunnel') {
        if (this.justPressedKeys.has('Digit1')) this.handleMiniGameInput('1');
        if (this.justPressedKeys.has('Digit2')) this.handleMiniGameInput('2');
        if (this.justPressedKeys.has('Digit3')) this.handleMiniGameInput('3');
        if (this.justPressedKeys.has('Digit4')) this.handleMiniGameInput('4');
      } else if (this.miniGame.routeId === 'glider') {
        if (this.justPressedKeys.has('KeyE') || this.justPressedKeys.has('Space')) {
          this.handleMiniGameInput('PUMP');
        }
      }
    }

    this.updatePlayer(dt);
    this.updateNpcs(dt);
    this.updateStationsAndPickups(dt);
    this.updateDecoys(dt);
    this.updateProjectiles(dt);
    this.updateAcidPools(dt);
    this.updateZombies(dt);
    this.updateChopperAndAlarm(dt);
    this.updateParticlesAndText(dt);
    this.updateCamera(dt);

    this.hudSyncTimer += dt;
    if (this.hudSyncTimer >= 0.08) {
      this.hudSyncTimer = 0;
      this.emitHud();
    }
  }

  private updatePlayer(dt: number): void {
    const p = this.player;
    p.invulnTimer = Math.max(0, p.invulnTimer - dt);
    p.hitFlash = Math.max(0, p.hitFlash - dt);
    p.fireCooldown = Math.max(0, p.fireCooldown - dt);
    p.batSwingTimer = Math.max(0, p.batSwingTimer - dt);
    p.speedBoostTimer = Math.max(0, p.speedBoostTimer - dt);
    p.squash += (1 - p.squash) * Math.min(1, dt * 14);

    if (this.justPressedKeys.has('Tab')) {
      this.cycleTrackedRoute();
    }
    if (this.justPressedKeys.has('KeyF') && !this.miniGame?.active) {
      this.toggleAutoAim();
    }
    if (this.justPressedKeys.has('Digit1') && !this.miniGame?.active) this.selectWeapon('bat');
    if (this.justPressedKeys.has('Digit2') && !this.miniGame?.active) this.selectWeapon('nailgun');
    if (this.justPressedKeys.has('Digit3') && !this.miniGame?.active) this.selectWeapon('tesla');

    if (this.justPressedKeys.has('KeyR') && p.activeWeapon === 'nailgun' && p.reloadingTimer <= 0) {
      this.startReload();
    }

    if (p.reloadingTimer > 0) {
      p.reloadingTimer -= dt;
      if (p.reloadingTimer <= 0) {
        const needed = p.nailMaxMag - p.nailMag;
        const load = Math.min(needed, p.nailAmmo);
        p.nailMag += load;
        p.nailAmmo -= load;
      }
    }

    // Movement (disabled while hotwiring/puzzling unless player cancels by pressing Esc or moving far)
    let moveX = 0;
    let moveY = 0;
    if (!this.miniGame?.active) {
      if (this.heldKeys.has('KeyW') || this.heldKeys.has('ArrowUp')) moveY -= 1;
      if (this.heldKeys.has('KeyS') || this.heldKeys.has('ArrowDown')) moveY += 1;
      if (this.heldKeys.has('KeyA') || this.heldKeys.has('ArrowLeft')) moveX -= 1;
      if (this.heldKeys.has('KeyD') || this.heldKeys.has('ArrowRight')) moveX += 1;
    }

    const moving = moveX !== 0 || moveY !== 0;
    if (moving) {
      const len = Math.hypot(moveX, moveY);
      moveX /= len;
      moveY /= len;
    }

    const wantsSprint =
      moving && (this.heldKeys.has('ShiftLeft') || this.heldKeys.has('ShiftRight')) && p.stamina > 4;
    let speed = 228;
    if (p.speedBoostTimer > 0) {
      speed *= 1.24;
    }
    if (wantsSprint) {
      speed *= 1.42;
      if (p.speedBoostTimer <= 0) {
        p.stamina = Math.max(0, p.stamina - 30 * dt);
      }
    } else {
      p.stamina = Math.min(p.maxStamina, p.stamina + (p.speedBoostTimer > 0 ? 45 : 22) * dt);
    }

    // Slow in acid pool
    for (const pool of this.acidPools) {
      if (Math.hypot(p.x - pool.x, p.y - pool.y) < pool.radius) {
        speed *= 0.62;
        if (p.invulnTimer <= 0) {
          this.damagePlayer(8, pool.x, pool.y);
        }
        break;
      }
    }

    p.vx = moveX * speed;
    p.vy = moveY * speed;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    this.resolveCircleWorldCollision(p, p.radius);

    // Aim toward mouse in world space
    const worldMouseX = this.camX - this.viewW / 2 + this.mouseScreen.x;
    const worldMouseY = this.camY - this.viewH / 2 + this.mouseScreen.y;
    p.angle = Math.atan2(worldMouseY - p.y, worldMouseX - p.x);

    // Throw decoy
    if (this.justPressedKeys.has('KeyQ') || this.rightMouseJustPressed) {
      this.throwDecoy();
    }

    // Attack
    const wantsFire =
      !this.miniGame?.active &&
      (this.mouseDown || this.mouseJustPressed || this.heldKeys.has('Space'));
    if (wantsFire && p.fireCooldown <= 0) {
      this.performPlayerAttack();
    }

    // Interact
    if (this.justPressedKeys.has('KeyE') && !this.miniGame?.active) {
      this.handleInteract();
    }
  }

  private startReload(): void {
    const p = this.player;
    if (p.nailMag >= p.nailMaxMag || p.nailAmmo <= 0) return;
    p.reloadingTimer = 0.85;
    soundEngine.playReload();
  }

  private performPlayerAttack(): void {
    const p = this.player;

    if (p.activeWeapon === 'bat') {
      p.fireCooldown = 0.36;
      p.batSwingTimer = 0.18;
      p.batSwingDir *= -1;
      p.squash = 1.18;
      soundEngine.playBatSwing();

      let hits = 0;
      const reach = 74;
      for (const z of this.zombies) {
        const dx = z.x - p.x;
        const dy = z.y - p.y;
        const dist = Math.hypot(dx, dy);
        if (dist <= reach + z.radius) {
          const angleDiff = Math.abs(this.normalizeAngle(Math.atan2(dy, dx) - p.angle));
          if (angleDiff <= 1.15) {
            this.damageZombie(z, 52, Math.cos(p.angle) * 320, Math.sin(p.angle) * 320, '#fbbf24');
            hits++;
          }
        }
      }
      // Also hit barrels with bat
      for (const b of this.barrels) {
        if (b.exploded) continue;
        const dx = b.x - p.x;
        const dy = b.y - p.y;
        const dist = Math.hypot(dx, dy);
        if (dist <= reach + b.radius) {
          const angleDiff = Math.abs(this.normalizeAngle(Math.atan2(dy, dx) - p.angle));
          if (angleDiff <= 1.15) {
            this.damageBarrel(b, 20);
            hits++;
          }
        }
      }

      if (hits > 0) {
        soundEngine.playBatHit();
        this.addShake(4.5, 0.14);
        this.hitstopTimer = Math.max(this.hitstopTimer, 0.036);
      }
      return;
    }

    if (p.activeWeapon === 'nailgun') {
      if (p.reloadingTimer > 0) return;
      if (p.nailMag <= 0) {
        if (p.nailAmmo > 0) {
          this.startReload();
        } else {
          p.fireCooldown = 0.25;
          soundEngine.playEmptyClick();
          this.addFloatingText(p.x, p.y - 24, 'No Nails! Use [1] Bat', '#f87171');
        }
        return;
      }

      p.nailMag--;
      p.fireCooldown = p.nailOverclocked ? 0.115 : 0.165;
      p.squash = 0.9;
      soundEngine.playNailgun();

      const baseAngle = this.getAssistedAimAngle(this.heldKeys.has('Space'));
      const spread = (Math.random() - 0.5) * 0.06;
      const a = baseAngle + spread;
      const muzzleX = p.x + Math.cos(baseAngle) * 20;
      const muzzleY = p.y + Math.sin(baseAngle) * 20;

      this.projectiles.push({
        x: muzzleX,
        y: muzzleY,
        vx: Math.cos(a) * 880,
        vy: Math.sin(a) * 880,
        radius: 4.5,
        damage: p.nailOverclocked ? 38 : 32,
        fromPlayer: true,
        kind: 'nail',
        life: 0.92,
        pierce: p.nailOverclocked ? 2 : 1,
        color: '#fde047',
      });

      this.spawnBurst(muzzleX, muzzleY, '#fde047', 4, 140);
      this.addShake(1.4, 0.05);

      if (p.nailMag === 0 && p.nailAmmo > 0) {
        this.startReload();
      }
      return;
    }

    if (p.activeWeapon === 'tesla') {
      if (p.teslaEnergy <= 0) {
        p.fireCooldown = 0.25;
        soundEngine.playEmptyClick();
        this.addFloatingText(p.x, p.y - 24, 'Tesla Empty!', '#38bdf8');
        return;
      }
      p.teslaEnergy--;
      p.fireCooldown = 0.28;
      soundEngine.playTesla();
      this.addShake(3.2, 0.11);

      // Fire instant chain lightning toward nearest zombie in aim cone (or shoot bolt forward)
      const maxRange = 360;
      let bestTarget: ZombieEntity | null = null;
      let bestScore = Infinity;

      for (const z of this.zombies) {
        const dx = z.x - p.x;
        const dy = z.y - p.y;
        const d = Math.hypot(dx, dy);
        if (d > maxRange) continue;
        const diff = Math.abs(this.normalizeAngle(Math.atan2(dy, dx) - p.angle));
        if (diff < 0.55) {
          const score = d + diff * 180;
          if (score < bestScore) {
            bestScore = score;
            bestTarget = z;
          }
        }
      }

      if (bestTarget) {
        const chainTargets: ZombieEntity[] = [bestTarget];
        const visited = new Set<number>([bestTarget.id]);
        let current: ZombieEntity = bestTarget;
        for (let c = 0; c < 2; c++) {
          let nextZ: ZombieEntity | null = null;
          let minD = 165;
          for (const z of this.zombies) {
            if (visited.has(z.id)) continue;
            const d = Math.hypot(z.x - current.x, z.y - current.y);
            if (d < minD) {
              minD = d;
              nextZ = z;
            }
          }
          if (nextZ) {
            visited.add(nextZ.id);
            chainTargets.push(nextZ);
            current = nextZ;
          }
        }

        const arcPts: Vec2[] = [{ x: p.x + Math.cos(p.angle) * 18, y: p.y + Math.sin(p.angle) * 18 }];
        chainTargets.forEach((zt, idx) => {
          const dmg = idx === 0 ? 64 : idx === 1 ? 42 : 28;
          arcPts.push({ x: zt.x, y: zt.y });
          this.damageZombie(zt, dmg, 0, 0, '#38bdf8');
          this.spawnBurst(zt.x, zt.y, '#7dd3fc', 8, 170);
        });
        this.lightningArcs.push({ points: arcPts, life: 0.18, maxLife: 0.18 });
        this.hitstopTimer = Math.max(this.hitstopTimer, 0.03);
      } else {
        // Arc bolt straight ahead
        const endX = p.x + Math.cos(p.angle) * 280;
        const endY = p.y + Math.sin(p.angle) * 280;
        this.lightningArcs.push({
          points: [
            { x: p.x + Math.cos(p.angle) * 18, y: p.y + Math.sin(p.angle) * 18 },
            { x: endX, y: endY },
          ],
          life: 0.14,
          maxLife: 0.14,
        });
        // Check barrels along ray
        for (const b of this.barrels) {
          if (b.exploded) continue;
          if (this.pointToSegmentDist(b.x, b.y, p.x, p.y, endX, endY) < b.radius + 14) {
            this.damageBarrel(b, 35);
          }
        }
      }
    }
  }

  private throwDecoy(): void {
    const p = this.player;
    if (p.decoys <= 0) {
      this.addFloatingText(p.x, p.y - 24, 'No Firecrackers', '#94a3b8');
      return;
    }
    p.decoys--;
    soundEngine.playDecoyThrow();
    this.decoys.push({
      x: p.x + Math.cos(p.angle) * 18,
      y: p.y + Math.sin(p.angle) * 18,
      vx: Math.cos(p.angle) * 340,
      vy: Math.sin(p.angle) * 340,
      life: 6.5,
      maxLife: 6.5,
      ringTimer: 0,
    });
  }

  private handleInteract(): void {
    const p = this.player;

    // 0. Rescue nearby unrescued human survivor
    for (const npc of this.npcs) {
      if (!npc.rescued && Math.hypot(p.x - npc.x, p.y - npc.y) <= 78) {
        this.rescueNpc(npc);
        return;
      }
    }

    // 1. Check Escape Route Extraction Point
    for (const route of Object.values(ESCAPE_ROUTES)) {
      const dist = Math.hypot(p.x - route.extractionX, p.y - route.extractionY);
      if (dist <= 84) {
        const routeParts = this.parts.filter((pt) => pt.routeId === route.id);
        const collectedCount = routeParts.filter((pt) => pt.collected).length;
        if (collectedCount < routeParts.length) {
          const missing = routeParts
            .filter((pt) => !pt.collected)
            .map((pt) => pt.name)
            .join(', ');
          this.showBanner(`Need ${missing} for ${route.shortTitle}!`, 3.2);
          soundEngine.playEmptyClick();
          return;
        }
        this.startExtraction(route.id);
        return;
      }
    }

    // 2. Check Interactive Stations
    let nearestStation: InteractiveStation | null = null;
    let bestD = Infinity;
    for (const st of this.stations) {
      const d = Math.hypot(p.x - st.x, p.y - st.y);
      if (d <= st.radius + 34 && d < bestD) {
        bestD = d;
        nearestStation = st;
      }
    }

    if (!nearestStation) return;

    if (nearestStation.cooldown > 0 || (nearestStation.kind === 'weapon_crate' && nearestStation.usedOnce)) {
      soundEngine.playEmptyClick();
      return;
    }

    if (nearestStation.kind === 'chai') {
      const heal = nearestStation.id === 'chai_canteen' ? 40 : 30;
      p.hp = Math.min(p.maxHp, p.hp + heal);
      nearestStation.cooldown = nearestStation.maxCooldown;
      soundEngine.playChaiHeal();
      this.addFloatingText(p.x, p.y - 26, `+${heal} HP Masala Chai`, '#34d399');
      this.spawnBurst(nearestStation.x, nearestStation.y, '#34d399', 12, 110);
    } else if (nearestStation.kind === 'coffee') {
      p.speedBoostTimer = 11;
      p.stamina = p.maxStamina;
      nearestStation.cooldown = nearestStation.maxCooldown;
      soundEngine.playChaiHeal();
      this.addFloatingText(p.x, p.y - 26, 'Cold Coffee Surge! (11s)', '#fbbf24');
      this.spawnBurst(nearestStation.x, nearestStation.y, '#fbbf24', 12, 110);
    } else if (nearestStation.kind === 'alarm') {
      nearestStation.cooldown = nearestStation.maxCooldown;
      this.activeAlarmPos = { x: nearestStation.x, y: nearestStation.y };
      this.activeAlarmZone = nearestStation.label.replace(' (Lure Horde)', '');
      this.activeAlarmRemaining = 11;
      soundEngine.playAlarmSiren();
      this.showBanner('Alarm Blaring! Nearby zombies are swarming the noise.', 3.4);
      this.spawnBurst(nearestStation.x, nearestStation.y, '#ef4444', 16, 150);
    } else if (nearestStation.kind === 'weapon_crate') {
      nearestStation.usedOnce = true;
      soundEngine.playKeyItemPickup();
      if (nearestStation.rewardWeapon === 'tesla') {
        p.unlockedWeapons.tesla = true;
        p.teslaEnergy = p.teslaMaxEnergy;
        p.activeWeapon = 'tesla';
        this.showBanner('Lab Tesla Coil Unlocked! Press [3] to zap chain lightning.', 4.0);
        this.addFloatingText(p.x, p.y - 28, 'Tesla Coil Unlocked!', '#38bdf8');
      } else {
        p.nailOverclocked = true;
        p.nailMaxMag = 28;
        p.nailMag = 28;
        p.nailAmmo += 72;
        p.activeWeapon = 'nailgun';
        this.showBanner('Nailgun Overclocked! +72 Nails & 28-Nail Drum.', 3.8);
        this.addFloatingText(p.x, p.y - 28, 'Nailgun Overclocked!', '#fde047');
      }
      this.spawnBurst(nearestStation.x, nearestStation.y, '#38bdf8', 22, 160);
    } else if (nearestStation.kind === 'locker') {
      nearestStation.cooldown = nearestStation.maxCooldown;
      soundEngine.playLootPickup();
      const roll = Math.random();
      if (roll < 0.35) {
        p.nailAmmo += 28;
        this.addFloatingText(p.x, p.y - 26, '+28 Nails', '#fde047');
      } else if (roll < 0.65) {
        p.hp = Math.min(p.maxHp, p.hp + 25);
        this.addFloatingText(p.x, p.y - 26, '+25 HP First Aid', '#4ade80');
      } else if (roll < 0.85) {
        p.decoys += 2;
        this.addFloatingText(p.x, p.y - 26, '+2 Firecrackers', '#fb923c');
      } else if (p.unlockedWeapons.tesla) {
        p.teslaEnergy = Math.min(p.teslaMaxEnergy, p.teslaEnergy + 18);
        this.addFloatingText(p.x, p.y - 26, '+18 Tesla Energy', '#38bdf8');
      } else {
        p.nailAmmo += 24;
        p.decoys += 1;
        this.addFloatingText(p.x, p.y - 26, '+24 Nails & Firecracker', '#fde047');
      }
      this.spawnBurst(nearestStation.x, nearestStation.y, '#fbbf24', 10, 110);
    }

    this.emitHud();
  }

  private startExtraction(routeId: EscapeRouteId): void {
    if (routeId === 'chopper') {
      if (!this.chopperHoldoutActive) {
        this.chopperHoldoutActive = true;
        this.chopperHoldoutRemaining = 18;
        soundEngine.playEscapeStart();
        this.showBanner('SOS Beacon Lit! Survive 18 seconds near the roof stairs!', 4.2);
        // Spawn an extraction pressure wave
        for (let i = 0; i < 6; i++) {
          this.spawnZombie(false, 420);
        }
        this.emitHud();
      }
      return;
    }

    if (routeId === 'bus') {
      const dirs: ('W' | 'A' | 'S' | 'D')[] = ['W', 'A', 'S', 'D'];
      const seq: ('W' | 'A' | 'S' | 'D')[] = Array.from({ length: 3 }, () => dirs[Math.floor(Math.random() * 4)]);
      this.miniGame = {
        active: true,
        routeId: 'bus',
        title: 'Hotwire the BMSIT Bus',
        subtitle: 'Tap or press the 3 keys in order:',
        sequence: seq,
        sequenceIndex: 0,
      };
      soundEngine.playEscapeStart();
      this.emitHud();
      return;
    }

    if (routeId === 'tunnel') {
      const nums = [1, 2, 3].sort(() => Math.random() - 0.5);
      this.miniGame = {
        active: true,
        routeId: 'tunnel',
        title: 'Bypass Drain Lock',
        subtitle: 'Tap or press keys 1–3 in order:',
        circuitOrder: nums,
        circuitStep: 0,
      };
      soundEngine.playEscapeStart();
      this.emitHud();
      return;
    }

    if (routeId === 'glider') {
      this.miniGame = {
        active: true,
        routeId: 'glider',
        title: 'Ignite Glider Thrusters',
        subtitle: 'Tap [E] / [Space] or click Boost 3 times!',
        chargeProgress: 25,
      };
      soundEngine.playEscapeStart();
      this.emitHud();
    }
  }

  private triggerVictory(routeId: EscapeRouteId): void {
    this.miniGame = null;
    this.chopperHoldoutActive = false;
    this.victoryRoute = routeId;
    this.phase = 'VICTORY';
    this.score += 1000 + Math.max(0, Math.floor(600 - this.elapsedSeconds * 2));
    soundEngine.playVictory();
    this.emitHud();
  }

  private getAssistedAimAngle(isSpaceKey: boolean): number {
    const p = this.player;
    if (!this.autoAim) return p.angle;

    let bestAngle = p.angle;
    let bestScore = Infinity;
    const maxDist = isSpaceKey ? 360 : 320;
    const maxCone = isSpaceKey ? Math.PI : 0.68;

    for (const z of this.zombies) {
      const dx = z.x - p.x;
      const dy = z.y - p.y;
      const d = Math.hypot(dx, dy);
      if (d > maxDist) continue;
      const targetAngle = Math.atan2(dy, dx);
      const diff = Math.abs(this.normalizeAngle(targetAngle - p.angle));
      if (diff <= maxCone) {
        const score = d + diff * 140;
        if (score < bestScore) {
          bestScore = score;
          bestAngle = targetAngle;
        }
      }
    }
    return bestAngle;
  }

  private rescueNpc(npc: HumanNpc): void {
    if (npc.rescued) return;
    npc.rescued = true;
    npc.speech = `I've got your back!`;
    npc.speechTimer = 3.2;
    this.score += 180;
    this.player.hp = Math.min(this.player.maxHp, this.player.hp + 20);
    this.player.nailAmmo += 20;
    soundEngine.playKeyItemPickup();
    this.spawnBurst(npc.x, npc.y, '#38bdf8', 18, 150);
    this.addFloatingText(npc.x, npc.y - 26, `${npc.name} Joined! +20 HP & Nails`, '#38bdf8');
    this.showBanner(`${npc.name} (${npc.role}) teamed up with you!`, 3.0);
    this.emitHud();
  }

  private updateNpcs(dt: number): void {
    const p = this.player;
    const rescuedList = this.npcs.filter((n) => n.rescued && !n.isStationaryVendor);

    for (const npc of this.npcs) {
      npc.hitFlash = Math.max(0, npc.hitFlash - dt);
      npc.fireCooldown = Math.max(0, npc.fireCooldown - dt);
      if (npc.speechTimer > 0) {
        npc.speechTimer -= dt;
        if (npc.speechTimer <= 0) npc.speech = null;
      }

      const distToPlayer = Math.hypot(p.x - npc.x, p.y - npc.y);

      if (npc.isStationaryVendor) {
        // Chai Uncle waves & greets when nearby
        npc.angle = Math.atan2(p.y - npc.y, p.x - npc.x);
        if (distToPlayer < 160 && !npc.speech) {
          npc.speech = 'Need hot chai? Press [E]!';
          npc.speechTimer = 3.5;
        }
        continue;
      }

      if (!npc.rescued) {
        npc.angle = Math.atan2(p.y - npc.y, p.x - npc.x);
        // Auto-rescue on close walk-up so play is super effortless!
        if (distToPlayer <= 42) {
          this.rescueNpc(npc);
        } else if (distToPlayer < 260 && !npc.speech) {
          npc.speech = 'Help! Over here!';
          npc.speechTimer = 2.8;
        }
        continue;
      }

      // Rescued ally follows player in clean trailing formation
      const slotIdx = rescuedList.indexOf(npc);
      const orbitAngle = p.angle + Math.PI + (slotIdx - (rescuedList.length - 1) / 2) * 0.72;
      const followDist = 54 + Math.floor(slotIdx / 2) * 26;
      const targetX = p.x + Math.cos(orbitAngle) * followDist;
      const targetY = p.y + Math.sin(orbitAngle) * followDist;

      const dx = targetX - npc.x;
      const dy = targetY - npc.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 14) {
        const spd = Math.min(245, dist * 4.2);
        npc.vx = (dx / dist) * spd;
        npc.vy = (dy / dist) * spd;
        npc.x += npc.vx * dt;
        npc.y += npc.vy * dt;
        this.resolveCircleWorldCollision(npc, npc.radius);
      }

      // Ally attacks nearest zombie within 275px!
      let nearestZ: ZombieEntity | null = null;
      let minZd = 275;
      for (const z of this.zombies) {
        const zd = Math.hypot(z.x - npc.x, z.y - npc.y);
        if (zd < minZd) {
          minZd = zd;
          nearestZ = z;
        }
      }

      if (nearestZ) {
        const aimA = Math.atan2(nearestZ.y - npc.y, nearestZ.x - npc.x);
        npc.angle = aimA;
        if (npc.fireCooldown <= 0) {
          npc.fireCooldown = 0.75 + Math.random() * 0.25;
          this.projectiles.push({
            x: npc.x + Math.cos(aimA) * 16,
            y: npc.y + Math.sin(aimA) * 16,
            vx: Math.cos(aimA) * 680,
            vy: Math.sin(aimA) * 680,
            radius: 3.5,
            damage: 20,
            fromPlayer: true,
            kind: 'ally_shot',
            life: 0.75,
            pierce: 1,
            color: '#67e8f9',
          });
          if (Math.random() < 0.16 && !npc.speech) {
            const quips = ['Got one!', 'Cover fire!', 'Watch out!', 'Keep moving!'];
            npc.speech = quips[Math.floor(Math.random() * quips.length)];
            npc.speechTimer = 1.8;
          }
        }
      } else if (dist > 14) {
        npc.angle = Math.atan2(dy, dx);
      }
    }
  }

  private updateStationsAndPickups(dt: number): void {
    for (const st of this.stations) {
      if (st.cooldown > 0) {
        st.cooldown = Math.max(0, st.cooldown - dt);
      }
    }

    // Auto-collect key escape route parts on walk-over
    for (const part of this.parts) {
      if (part.collected) continue;
      if (Math.hypot(this.player.x - part.x, this.player.y - part.y) <= this.player.radius + 22) {
        part.collected = true;
        this.trackedRoute = part.routeId;
        this.score += 250;
        soundEngine.playKeyItemPickup();
        this.spawnBurst(part.x, part.y, part.color, 20, 170);
        this.addFloatingText(part.x, part.y - 22, `Found ${part.name}!`, part.color);

        const routeParts = this.parts.filter((pt) => pt.routeId === part.routeId);
        const done = routeParts.filter((pt) => pt.collected).length;
        if (done === routeParts.length) {
          this.showBanner(
            `${ESCAPE_ROUTES[part.routeId].shortTitle} Ready! Head to ${ESCAPE_ROUTES[part.routeId].extractionName}!`,
            4.5
          );
        } else {
          this.showBanner(`Collected ${part.name} (${done}/${routeParts.length} for ${ESCAPE_ROUTES[part.routeId].shortTitle})`, 3.0);
        }
        this.emitHud();
      }
    }

    // Auto-collect zombie drops
    for (let i = this.drops.length - 1; i >= 0; i--) {
      const d = this.drops[i];
      d.bobPhase += dt * 4.5;
      d.life -= dt;
      if (d.life <= 0) {
        this.drops.splice(i, 1);
        continue;
      }
      if (Math.hypot(this.player.x - d.x, this.player.y - d.y) <= this.player.radius + 20) {
        soundEngine.playLootPickup();
        if (d.kind === 'medkit') {
          this.player.hp = Math.min(this.player.maxHp, this.player.hp + d.amount);
          this.addFloatingText(d.x, d.y - 16, `+${d.amount} HP`, '#4ade80');
        } else if (d.kind === 'ammo') {
          this.player.nailAmmo += d.amount;
          this.addFloatingText(d.x, d.y - 16, `+${d.amount} Nails`, '#fde047');
        } else if (d.kind === 'battery') {
          if (this.player.unlockedWeapons.tesla) {
            this.player.teslaEnergy = Math.min(this.player.teslaMaxEnergy, this.player.teslaEnergy + d.amount);
            this.addFloatingText(d.x, d.y - 16, `+${d.amount} Energy`, '#38bdf8');
          } else {
            this.player.nailAmmo += 12;
            this.addFloatingText(d.x, d.y - 16, '+12 Nails', '#fde047');
          }
        } else if (d.kind === 'decoy') {
          this.player.decoys += d.amount;
          this.addFloatingText(d.x, d.y - 16, `+${d.amount} Firecracker`, '#fb923c');
        }
        this.drops.splice(i, 1);
      }
    }
  }

  private updateDecoys(dt: number): void {
    for (let i = this.decoys.length - 1; i >= 0; i--) {
      const dec = this.decoys[i];
      dec.x += dec.vx * dt;
      dec.y += dec.vy * dt;
      dec.vx *= Math.pow(0.06, dt);
      dec.vy *= Math.pow(0.06, dt);
      this.resolveCircleWorldCollision(dec, 7);

      dec.life -= dt;
      dec.ringTimer -= dt;
      if (dec.ringTimer <= 0) {
        dec.ringTimer = 0.65;
        soundEngine.playDecoyPop();
        this.spawnBurst(dec.x, dec.y, '#fb923c', 6, 95);
      }
      if (dec.life <= 0) {
        this.decoys.splice(i, 1);
      }
    }
  }

  private updateProjectiles(dt: number): void {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const proj = this.projectiles[i];
      proj.x += proj.vx * dt;
      proj.y += proj.vy * dt;
      proj.life -= dt;

      if (proj.life <= 0 || this.pointHitsWall(proj.x, proj.y, proj.radius)) {
        if (proj.kind === 'acid') {
          this.acidPools.push({ x: proj.x, y: proj.y, radius: 42, life: 5.5, maxLife: 5.5 });
        } else {
          this.spawnBurst(proj.x, proj.y, proj.color, 4, 90);
        }
        this.projectiles.splice(i, 1);
        continue;
      }

      if (proj.fromPlayer) {
        let removed = false;
        // Check explosive barrels
        for (const b of this.barrels) {
          if (b.exploded) continue;
          if (Math.hypot(proj.x - b.x, proj.y - b.y) <= b.radius + proj.radius) {
            this.damageBarrel(b, proj.damage);
            this.projectiles.splice(i, 1);
            removed = true;
            break;
          }
        }
        if (removed) continue;

        // Check zombies
        for (const z of this.zombies) {
          if (Math.hypot(proj.x - z.x, proj.y - z.y) <= z.radius + proj.radius) {
            const len = Math.hypot(proj.vx, proj.vy) || 1;
            this.damageZombie(z, proj.damage, (proj.vx / len) * 90, (proj.vy / len) * 90, proj.color);
            proj.pierce--;
            if (proj.pierce <= 0) {
              this.projectiles.splice(i, 1);
              removed = true;
            }
            break;
          }
        }
      } else {
        // Acid spit projectile from spitter
        if (Math.hypot(proj.x - this.player.x, proj.y - this.player.y) <= this.player.radius + proj.radius) {
          this.damagePlayer(proj.damage, proj.x, proj.y);
          this.acidPools.push({ x: proj.x, y: proj.y, radius: 44, life: 5.5, maxLife: 5.5 });
          this.projectiles.splice(i, 1);
        }
      }
    }
  }

  private updateAcidPools(dt: number): void {
    for (let i = this.acidPools.length - 1; i >= 0; i--) {
      this.acidPools[i].life -= dt;
      if (this.acidPools[i].life <= 0) {
        this.acidPools.splice(i, 1);
      }
    }
  }

  private updateZombies(dt: number): void {
    const cfg = DIFFICULTY_CFG[this.difficulty];
    const waveMult = 1 + Math.min(1.1, this.elapsedSeconds / 150);
    const maxZ = Math.min(62, Math.floor(cfg.maxZombies * waveMult));

    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0 && this.zombies.length < maxZ) {
      const interval = Math.max(0.55, cfg.spawnInterval / waveMult);
      this.spawnTimer = this.chopperHoldoutActive ? interval * 0.52 : interval;
      this.spawnZombie(false);
    }

    for (let i = this.zombies.length - 1; i >= 0; i--) {
      const z = this.zombies[i];
      z.hitFlash = Math.max(0, z.hitFlash - dt);
      z.attackCooldown = Math.max(0, z.attackCooldown - dt);
      z.squash += (1 - z.squash) * Math.min(1, dt * 10);

      // Determine attraction target (Decoy > Active Fire Alarm > Player)
      let tx = this.player.x;
      let ty = this.player.y;
      let lured = false;

      for (const dec of this.decoys) {
        if (Math.hypot(dec.x - z.x, dec.y - z.y) < 420) {
          tx = dec.x;
          ty = dec.y;
          lured = true;
          break;
        }
      }
      if (!lured && this.activeAlarmPos && this.activeAlarmRemaining > 0) {
        if (Math.hypot(this.activeAlarmPos.x - z.x, this.activeAlarmPos.y - z.y) < 620) {
          tx = this.activeAlarmPos.x;
          ty = this.activeAlarmPos.y;
          lured = true;
        }
      }

      const dx = tx - z.x;
      const dy = ty - z.y;
      const dist = Math.hypot(dx, dy) || 1;
      const dirX = dx / dist;
      const dirY = dy / dist;

      // State machine per zombie type with clear telegraphs
      if (z.type === 'sprinter') {
        if (z.state === 'chase') {
          z.angle = Math.atan2(dirY, dirX);
          z.vx = dirX * z.speed;
          z.vy = dirY * z.speed;
          if (!lured && dist < 210 && dist > 60 && z.attackCooldown <= 0) {
            z.state = 'windup';
            z.stateTimer = 0.45;
            z.targetX = dirX;
            z.targetY = dirY;
            z.vx = 0;
            z.vy = 0;
          }
        } else if (z.state === 'windup') {
          z.stateTimer -= dt;
          if (z.stateTimer <= 0) {
            z.state = 'lunge';
            z.stateTimer = 0.34;
            z.vx = z.targetX * 395;
            z.vy = z.targetY * 395;
            z.squash = 1.25;
          }
        } else if (z.state === 'lunge') {
          z.stateTimer -= dt;
          if (z.stateTimer <= 0) {
            z.state = 'chase';
            z.attackCooldown = 2.6;
          }
        }
      } else if (z.type === 'brute') {
        if (z.state === 'chase') {
          z.angle = Math.atan2(dirY, dirX);
          z.vx = dirX * z.speed;
          z.vy = dirY * z.speed;
          if (!lured && dist < 85 && z.attackCooldown <= 0) {
            z.state = 'slam';
            z.stateTimer = 0.65;
            z.vx = 0;
            z.vy = 0;
          }
        } else if (z.state === 'slam') {
          z.stateTimer -= dt;
          if (z.stateTimer <= 0) {
            // Shockwave slam
            soundEngine.playBruteSlam();
            this.addShake(7, 0.2);
            this.spawnBurst(z.x, z.y, '#ef4444', 18, 180);
            if (Math.hypot(this.player.x - z.x, this.player.y - z.y) <= 98) {
              this.damagePlayer(z.damage * 1.4, z.x, z.y);
            }
            z.state = 'chase';
            z.attackCooldown = 2.4;
          }
        }
      } else if (z.type === 'spitter') {
        z.angle = Math.atan2(dirY, dirX);
        if (z.state === 'chase') {
          if (dist > 250 || lured) {
            z.vx = dirX * z.speed;
            z.vy = dirY * z.speed;
          } else if (dist < 140) {
            z.vx = -dirX * z.speed * 0.7;
            z.vy = -dirY * z.speed * 0.7;
          } else {
            z.vx = 0;
            z.vy = 0;
          }
          if (!lured && dist < 340 && z.attackCooldown <= 0) {
            z.state = 'spit_windup';
            z.stateTimer = 0.55;
            z.vx = 0;
            z.vy = 0;
          }
        } else if (z.state === 'spit_windup') {
          z.stateTimer -= dt;
          if (z.stateTimer <= 0) {
            const a = Math.atan2(this.player.y - z.y, this.player.x - z.x);
            this.projectiles.push({
              x: z.x + Math.cos(a) * 18,
              y: z.y + Math.sin(a) * 18,
              vx: Math.cos(a) * 340,
              vy: Math.sin(a) * 340,
              radius: 7,
              damage: z.damage,
              fromPlayer: false,
              kind: 'acid',
              life: 1.25,
              pierce: 1,
              color: '#84cc16',
            });
            z.state = 'chase';
            z.attackCooldown = 2.9;
          }
        }
      } else {
        // Shambler
        z.angle = Math.atan2(dirY, dirX);
        z.vx = dirX * z.speed;
        z.vy = dirY * z.speed;
      }

      // Soft zombie-to-zombie separation so packs don't stack into one pixel
      for (let j = i - 1; j >= 0; j--) {
        const other = this.zombies[j];
        const sdx = z.x - other.x;
        const sdy = z.y - other.y;
        const sd = Math.hypot(sdx, sdy);
        const minDist = z.radius + other.radius;
        if (sd > 0 && sd < minDist) {
          const push = (minDist - sd) * 0.45;
          const nx = sdx / sd;
          const ny = sdy / sd;
          z.x += nx * push;
          z.y += ny * push;
          other.x -= nx * push;
          other.y -= ny * push;
        }
      }

      z.x += z.vx * dt;
      z.y += z.vy * dt;
      this.resolveCircleWorldCollision(z, z.radius);

      // Melee bite check on player
      const pd = Math.hypot(this.player.x - z.x, this.player.y - z.y);
      if (!lured && pd <= this.player.radius + z.radius + 2 && z.attackCooldown <= 0 && z.state !== 'slam') {
        this.damagePlayer(z.damage, z.x, z.y);
        z.attackCooldown = 0.85;
      }
    }
  }

  private spawnZombie(initialSpread: boolean, exactRadius?: number): void {
    const cfg = DIFFICULTY_CFG[this.difficulty];
    const t = this.elapsedSeconds;

    let x = 0;
    let y = 0;
    for (let attempt = 0; attempt < 15; attempt++) {
      if (initialSpread) {
        x = 180 + Math.random() * (WORLD_WIDTH - 360);
        y = 180 + Math.random() * (WORLD_HEIGHT - 360);
      } else {
        const ang = Math.random() * Math.PI * 2;
        const r = exactRadius ?? 560 + Math.random() * 240;
        x = Math.max(80, Math.min(WORLD_WIDTH - 80, this.player.x + Math.cos(ang) * r));
        y = Math.max(80, Math.min(WORLD_HEIGHT - 80, this.player.y + Math.sin(ang) * r));
      }
      if (Math.hypot(x - this.player.x, y - this.player.y) > 360 && !this.pointHitsWall(x, y, 22)) {
        break;
      }
    }

    // Choose archetype based on elapsed time
    const roll = Math.random();
    let type: ZombieType = 'shambler';
    if (t > 45 && roll < 0.14) type = 'brute';
    else if (t > 24 && roll < 0.34) type = 'spitter';
    else if (t > 10 && roll < 0.58) type = 'sprinter';

    const specs: Record<ZombieType, { r: number; hp: number; spd: number; dmg: number }> = {
      shambler: { r: 15, hp: 58, spd: 96 + Math.random() * 22, dmg: 14 },
      sprinter: { r: 14, hp: 42, spd: 138 + Math.random() * 18, dmg: 12 },
      brute: { r: 24, hp: 195, spd: 68, dmg: 24 },
      spitter: { r: 15, hp: 54, spd: 88, dmg: 14 },
    };

    const s = specs[type];
    const hp = Math.round(s.hp * cfg.zombieHpMult);
    this.zombies.push({
      id: this.nextZombieId++,
      type,
      x,
      y,
      vx: 0,
      vy: 0,
      radius: s.r,
      hp,
      maxHp: hp,
      speed: s.spd,
      damage: Math.round(s.dmg * cfg.zombieDmgMult),
      angle: 0,
      hitFlash: 0,
      squash: 1,
      state: 'chase',
      stateTimer: 0,
      attackCooldown: 0,
      targetX: 0,
      targetY: 0,
    });
  }

  private damageZombie(z: ZombieEntity, amount: number, knockX: number, knockY: number, color: string): void {
    z.hp -= amount;
    z.hitFlash = 0.12;
    z.squash = 1.2;
    z.x += knockX * 0.08;
    z.y += knockY * 0.08;
    this.resolveCircleWorldCollision(z, z.radius);

    this.spawnBurst(z.x, z.y, color, 5, 110);
    this.addFloatingText(z.x, z.y - z.radius - 6, `${Math.round(amount)}`, '#f8fafc');
    soundEngine.playZombieHit();

    if (z.hp <= 0) {
      const idx = this.zombies.indexOf(z);
      if (idx !== -1) this.zombies.splice(idx, 1);
      this.kills++;
      this.score += z.type === 'brute' ? 120 : z.type === 'spitter' ? 75 : 45;
      this.spawnBurst(z.x, z.y, z.type === 'spitter' ? '#84cc16' : '#ef4444', 14, 160);

      // Loot drop chance
      const r = Math.random();
      if (r < 0.28) {
        this.drops.push({
          id: `drop_${performance.now()}_${Math.random()}`,
          kind: 'ammo',
          x: z.x,
          y: z.y,
          amount: 14,
          bobPhase: Math.random() * 6,
          life: 24,
        });
      } else if (r < 0.42) {
        this.drops.push({
          id: `drop_${performance.now()}_${Math.random()}`,
          kind: 'medkit',
          x: z.x,
          y: z.y,
          amount: 18,
          bobPhase: Math.random() * 6,
          life: 24,
        });
      } else if (r < 0.5 && this.player.unlockedWeapons.tesla) {
        this.drops.push({
          id: `drop_${performance.now()}_${Math.random()}`,
          kind: 'battery',
          x: z.x,
          y: z.y,
          amount: 10,
          bobPhase: Math.random() * 6,
          life: 24,
        });
      } else if (r < 0.56) {
        this.drops.push({
          id: `drop_${performance.now()}_${Math.random()}`,
          kind: 'decoy',
          x: z.x,
          y: z.y,
          amount: 1,
          bobPhase: Math.random() * 6,
          life: 24,
        });
      }
    }
  }

  private damageBarrel(b: ExplosiveBarrel, dmg: number): void {
    if (b.exploded) return;
    b.hp -= dmg;
    b.hitFlash = 0.1;
    if (b.hp <= 0) {
      this.detonateBarrel(b);
    }
  }

  private detonateBarrel(b: ExplosiveBarrel): void {
    if (b.exploded) return;
    b.exploded = true;
    this.barrelsDetonated++;
    this.score += 100;
    soundEngine.playExplosion();
    this.addShake(11, 0.32);
    this.hitstopTimer = 0.055;
    this.spawnBurst(b.x, b.y, '#fb923c', 28, 280);
    this.spawnBurst(b.x, b.y, '#fde047', 16, 200);
    this.addFloatingText(b.x, b.y - 24, 'BOOM!', '#fb923c');

    const blastRadius = 155;
    for (let i = this.zombies.length - 1; i >= 0; i--) {
      const z = this.zombies[i];
      const d = Math.hypot(z.x - b.x, z.y - b.y);
      if (d <= blastRadius) {
        const ratio = 1 - d / blastRadius;
        const kx = ((z.x - b.x) / (d || 1)) * 380;
        const ky = ((z.y - b.y) / (d || 1)) * 380;
        this.damageZombie(z, 170 * (0.45 + ratio * 0.65), kx, ky, '#fb923c');
      }
    }

    // Chain-react nearby barrels!
    for (const other of this.barrels) {
      if (!other.exploded && Math.hypot(other.x - b.x, other.y - b.y) <= blastRadius) {
        other.hp = 0;
        this.detonateBarrel(other);
      }
    }

    const pd = Math.hypot(this.player.x - b.x, this.player.y - b.y);
    if (pd <= 105) {
      this.damagePlayer(20, b.x, b.y);
    }
  }

  private damagePlayer(amount: number, srcX: number, srcY: number): void {
    const p = this.player;
    if (p.invulnTimer > 0 || this.phase !== 'PLAYING') return;

    p.hp = Math.max(0, p.hp - amount);
    p.invulnTimer = 0.45;
    p.hitFlash = 0.2;
    p.squash = 0.84;
    soundEngine.playPlayerHurt();
    this.addShake(6.5, 0.2);

    const dx = p.x - srcX;
    const dy = p.y - srcY;
    const d = Math.hypot(dx, dy) || 1;
    p.x += (dx / d) * 14;
    p.y += (dy / d) * 14;
    this.resolveCircleWorldCollision(p, p.radius);

    if (p.hp <= 0) {
      this.miniGame = null;
      this.phase = 'GAME_OVER';
      soundEngine.playGameOver();
      this.emitHud();
    }
  }

  private updateChopperAndAlarm(dt: number): void {
    if (this.activeAlarmRemaining > 0) {
      this.activeAlarmRemaining -= dt;
      if (this.activeAlarmRemaining <= 0) {
        this.activeAlarmPos = null;
        this.activeAlarmZone = null;
      }
    }

    if (this.chopperHoldoutActive) {
      const route = ESCAPE_ROUTES.chopper;
      const dist = Math.hypot(this.player.x - route.extractionX, this.player.y - route.extractionY);
      if (dist <= 260) {
        this.chopperHoldoutRemaining -= dt;
        if (this.chopperHoldoutRemaining <= 0) {
          this.triggerVictory('chopper');
        }
      } else {
        this.showBanner('Stay inside Academic Block to catch the Chopper!', 1.5);
      }
    }
  }

  private updateParticlesAndText(dt: number): void {
    for (const pt of this.particles) {
      if (!pt.active) continue;
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.vx *= Math.pow(pt.drag, dt * 60);
      pt.vy *= Math.pow(pt.drag, dt * 60);
      pt.life -= dt;
      pt.alpha = Math.max(0, pt.life / pt.maxLife);
      if (pt.life <= 0) pt.active = false;
    }

    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y += ft.vy * dt;
      ft.life -= dt;
      if (ft.life <= 0) this.floatingTexts.splice(i, 1);
    }

    for (let i = this.lightningArcs.length - 1; i >= 0; i--) {
      this.lightningArcs[i].life -= dt;
      if (this.lightningArcs[i].life <= 0) this.lightningArcs.splice(i, 1);
    }
  }

  private updateCamera(dt: number): void {
    const lookOffsetX = (this.mouseScreen.x - this.viewW / 2) * 0.14;
    const lookOffsetY = (this.mouseScreen.y - this.viewH / 2) * 0.14;
    const targetX = Math.max(this.viewW / 2, Math.min(WORLD_WIDTH - this.viewW / 2, this.player.x + lookOffsetX));
    const targetY = Math.max(this.viewH / 2, Math.min(WORLD_HEIGHT - this.viewH / 2, this.player.y + lookOffsetY));

    const smooth = 1 - Math.exp(-8.5 * dt);
    this.camX += (targetX - this.camX) * smooth;
    this.camY += (targetY - this.camY) * smooth;
    this.updateCameraShake(dt);
  }

  private updateCameraShake(dt: number): void {
    if (this.shakeTimer > 0) {
      this.shakeTimer = Math.max(0, this.shakeTimer - dt);
    }
  }

  private addShake(intensity: number, duration: number): void {
    this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
    this.shakeTimer = Math.max(this.shakeTimer, duration);
  }

  private spawnBurst(x: number, y: number, color: string, count: number, speed: number): void {
    let spawned = 0;
    for (const pt of this.particles) {
      if (pt.active) continue;
      const a = Math.random() * Math.PI * 2;
      const spd = speed * (0.3 + Math.random() * 0.7);
      pt.active = true;
      pt.x = x;
      pt.y = y;
      pt.vx = Math.cos(a) * spd;
      pt.vy = Math.sin(a) * spd;
      pt.size = 2.2 + Math.random() * 3.4;
      pt.color = color;
      pt.maxLife = 0.25 + Math.random() * 0.3;
      pt.life = pt.maxLife;
      pt.alpha = 1;
      pt.drag = 0.91;
      spawned++;
      if (spawned >= count) break;
    }
  }

  private addFloatingText(x: number, y: number, text: string, color: string): void {
    this.floatingTexts.push({
      x,
      y,
      vy: -36,
      text,
      color,
      life: 0.95,
      maxLife: 0.95,
      scale: 1,
    });
  }

  private showBanner(msg: string, seconds: number): void {
    this.bannerMessage = msg;
    this.bannerTimer = seconds;
  }

  // Collision helpers
  private resolveCircleWorldCollision(entity: { x: number; y: number }, radius: number): void {
    entity.x = Math.max(radius + 24, Math.min(WORLD_WIDTH - radius - 24, entity.x));
    entity.y = Math.max(radius + 24, Math.min(WORLD_HEIGHT - radius - 24, entity.y));

    for (const w of this.walls) {
      const closestX = Math.max(w.x, Math.min(entity.x, w.x + w.w));
      const closestY = Math.max(w.y, Math.min(entity.y, w.y + w.h));
      const dx = entity.x - closestX;
      const dy = entity.y - closestY;
      const distSq = dx * dx + dy * dy;
      if (distSq < radius * radius) {
        const dist = Math.sqrt(distSq);
        if (dist > 0.0001) {
          const overlap = radius - dist;
          entity.x += (dx / dist) * overlap;
          entity.y += (dy / dist) * overlap;
        } else {
          entity.y -= radius;
        }
      }
    }
  }

  private pointHitsWall(x: number, y: number, radius: number): boolean {
    if (x < 24 || x > WORLD_WIDTH - 24 || y < 24 || y > WORLD_HEIGHT - 24) return true;
    for (const w of this.walls) {
      const cx = Math.max(w.x, Math.min(x, w.x + w.w));
      const cy = Math.max(w.y, Math.min(y, w.y + w.h));
      const dx = x - cx;
      const dy = y - cy;
      if (dx * dx + dy * dy < radius * radius) return true;
    }
    return false;
  }

  private pointToSegmentDist(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
    const l2 = (x2 - x1) ** 2 + (y2 - y1) ** 2;
    if (l2 === 0) return Math.hypot(px - x1, py - y1);
    const t = Math.max(0, Math.min(1, ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2));
    return Math.hypot(px - (x1 + t * (x2 - x1)), py - (y1 + t * (y2 - y1)));
  }

  private normalizeAngle(a: number): number {
    while (a > Math.PI) a -= Math.PI * 2;
    while (a < -Math.PI) a += Math.PI * 2;
    return a;
  }

  private getCurrentZoneName(): string {
    for (const z of CAMPUS_ZONES) {
      if (
        this.player.x >= z.x &&
        this.player.x <= z.x + z.w &&
        this.player.y >= z.y &&
        this.player.y <= z.y + z.h
      ) {
        return z.name;
      }
    }
    return 'BMSIT Campus Grounds';
  }

  private getContextPrompt(): string | null {
    const p = this.player;
    for (const npc of this.npcs) {
      if (!npc.rescued && Math.hypot(p.x - npc.x, p.y - npc.y) <= 78) {
        return `[E] Rescue ${npc.name} (${npc.role})`;
      }
    }

    for (const route of Object.values(ESCAPE_ROUTES)) {
      if (Math.hypot(p.x - route.extractionX, p.y - route.extractionY) <= 84) {
        const rParts = this.parts.filter((pt) => pt.routeId === route.id);
        const ready = rParts.every((pt) => pt.collected);
        if (route.id === 'chopper' && this.chopperHoldoutActive) {
          return `Chopper Arriving in ${Math.ceil(this.chopperHoldoutRemaining)}s — Defend!`;
        }
        return ready
          ? `[E] Activate ${route.extractionName}`
          : `${route.extractionName} (Missing ${rParts.filter((x) => !x.collected).length} parts)`;
      }
    }

    for (const st of this.stations) {
      if (Math.hypot(p.x - st.x, p.y - st.y) <= st.radius + 34) {
        if (st.kind === 'weapon_crate' && st.usedOnce) return `${st.label} (Opened)`;
        if (st.cooldown > 0) return `${st.label} (Ready in ${Math.ceil(st.cooldown)}s)`;
        return `[E] ${st.label}`;
      }
    }
    return null;
  }

  private emitHud(): void {
    const routeProgress = {} as HudSnapshot['routeProgress'];
    for (const rId of ['bus', 'chopper', 'tunnel', 'glider'] as EscapeRouteId[]) {
      const rParts = this.parts.filter((pt) => pt.routeId === rId);
      const collected = rParts.filter((pt) => pt.collected).length;
      routeProgress[rId] = {
        collected,
        total: rParts.length,
        ready: collected === rParts.length,
        partNames: rParts.map((pt) => ({
          id: pt.id,
          name: pt.name,
          locationHint: pt.locationHint,
          collected: pt.collected,
        })),
      };
    }

    const trackedDef = ESCAPE_ROUTES[this.trackedRoute];
    const nextPart = this.parts.find((pt) => pt.routeId === this.trackedRoute && !pt.collected);
    const tx = nextPart ? nextPart.x : trackedDef.extractionX;
    const ty = nextPart ? nextPart.y : trackedDef.extractionY;
    const targetLabel = nextPart ? `${nextPart.name} (${nextPart.locationHint})` : trackedDef.extractionName;
    const distPx = Math.hypot(tx - this.player.x, ty - this.player.y);
    const targetDirectionAngle = Math.atan2(ty - this.player.y, tx - this.player.x);

    const minimapBlips: MinimapBlip[] = [];
    for (const pt of this.parts) {
      if (!pt.collected && pt.routeId === this.trackedRoute) {
        minimapBlips.push({ x: pt.x, y: pt.y, kind: 'part', color: pt.color });
      }
    }
    minimapBlips.push({
      x: trackedDef.extractionX,
      y: trackedDef.extractionY,
      kind: 'extraction',
      color: trackedDef.accentColor,
    });
    for (const npc of this.npcs) {
      if (!npc.isStationaryVendor) {
        minimapBlips.push({
          x: npc.x,
          y: npc.y,
          kind: 'human',
          color: npc.rescued ? '#38bdf8' : '#facc15',
        });
      }
    }
    for (const z of this.zombies) {
      minimapBlips.push({ x: z.x, y: z.y, kind: 'zombie', color: '#ef4444' });
    }

    const rescuable = this.npcs.filter((n) => !n.isStationaryVendor);
    const rescuedCount = rescuable.filter((n) => n.rescued).length;

    this.onHudUpdate({
      phase: this.phase,
      difficulty: this.difficulty,
      hp: Math.ceil(this.player.hp),
      maxHp: this.player.maxHp,
      stamina: Math.round(this.player.stamina),
      maxStamina: this.player.maxStamina,
      speedBoostTimer: this.player.speedBoostTimer,
      elapsedSeconds: this.elapsedSeconds,
      kills: this.kills,
      score: this.score,
      waveLevel: 1 + Math.floor(this.elapsedSeconds / 30),
      survivorsRescued: rescuedCount,
      totalSurvivors: rescuable.length,
      autoAim: this.autoAim,
      currentZoneName: this.getCurrentZoneName(),
      activeWeapon: this.player.activeWeapon,
      unlockedWeapons: { ...this.player.unlockedWeapons },
      nailAmmo: this.player.nailAmmo,
      nailMag: this.player.nailMag,
      nailMaxMag: this.player.nailMaxMag,
      teslaEnergy: this.player.teslaEnergy,
      teslaMaxEnergy: this.player.teslaMaxEnergy,
      reloadingTimer: this.player.reloadingTimer,
      decoys: this.player.decoys,
      trackedRoute: this.trackedRoute,
      routeProgress,
      targetDirectionAngle,
      targetDistanceMeters: Math.round(distPx / 18),
      targetLabel,
      contextPrompt: this.getContextPrompt(),
      chopperHoldoutActive: this.chopperHoldoutActive,
      chopperHoldoutRemaining: Math.max(0, this.chopperHoldoutRemaining),
      activeAlarmZone: this.activeAlarmZone,
      activeAlarmRemaining: Math.max(0, this.activeAlarmRemaining),
      miniGame: this.miniGame ? { ...this.miniGame } : null,
      bannerMessage: this.bannerMessage,
      victoryRoute: this.victoryRoute,
      barrelsDetonated: this.barrelsDetonated,
      playerX: this.player.x,
      playerY: this.player.y,
      worldW: WORLD_WIDTH,
      worldH: WORLD_HEIGHT,
      minimapBlips,
    });
  }

  // ==================== RENDERING ====================
  private render(): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.scale(this.dpr, this.dpr);

    // Clear campus night asphalt
    ctx.fillStyle = '#0f1620';
    ctx.fillRect(0, 0, this.viewW, this.viewH);

    // Camera transform + shake
    let shakeX = 0;
    let shakeY = 0;
    if (this.shakeTimer > 0) {
      const mag = this.shakeIntensity * (this.shakeTimer / 0.25);
      shakeX = (Math.random() - 0.5) * mag * 2;
      shakeY = (Math.random() - 0.5) * mag * 2;
    }

    const offsetX = Math.round(this.viewW / 2 - this.camX + shakeX);
    const offsetY = Math.round(this.viewH / 2 - this.camY + shakeY);

    ctx.save();
    ctx.translate(offsetX, offsetY);

    this.drawCampusGround(ctx);
    this.drawAcidPools(ctx);
    this.drawExtractionZones(ctx);
    this.drawStations(ctx);
    this.drawParts(ctx);
    this.drawDrops(ctx);
    this.drawBarrels(ctx);
    this.drawWallsAndProps(ctx);
    this.drawDecoys(ctx);
    this.drawNpcs(ctx);
    this.drawZombies(ctx);
    this.drawPlayer(ctx);
    this.drawProjectiles(ctx);
    this.drawLightningArcs(ctx);
    this.drawParticles(ctx);
    this.drawFloatingTexts(ctx);

    ctx.restore();

    // Dynamic atmospheric night lighting + flashlight cone
    this.renderNightLighting(ctx, offsetX, offsetY);

    // Directional compass arrow on screen edge for tracked objective
    if (this.phase === 'PLAYING') {
      this.drawObjectiveEdgeIndicator(ctx, offsetX, offsetY);
    }

    ctx.restore();
  }

  private drawCampusGround(ctx: CanvasRenderingContext2D): void {
    // Campus walkways & road grid
    ctx.fillStyle = '#141d29';
    ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    // Subtle tile grid on grounds
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.045)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= WORLD_WIDTH; x += 80) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, WORLD_HEIGHT);
      ctx.stroke();
    }
    for (let y = 0; y <= WORLD_HEIGHT; y += 80) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(WORLD_WIDTH, y);
      ctx.stroke();
    }

    // Main asphalt road leading to Main Gate
    ctx.fillStyle = '#1b232e';
    ctx.fillRect(880, 1220, 640, 580);
    ctx.strokeStyle = 'rgba(250, 204, 21, 0.25)';
    ctx.setLineDash([22, 18]);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(1200, 1240);
    ctx.lineTo(1200, 1780);
    ctx.stroke();
    ctx.setLineDash([]);

    // Building & Zone floors
    for (const z of CAMPUS_ZONES) {
      ctx.fillStyle = z.floorColor;
      ctx.fillRect(z.x, z.y, z.w, z.h);
      ctx.strokeStyle = `${z.accentColor}26`;
      ctx.lineWidth = 2;
      ctx.strokeRect(z.x, z.y, z.w, z.h);

      // Subtle zone watermark label on floor
      ctx.fillStyle = 'rgba(226, 232, 240, 0.14)';
      ctx.font = '700 22px "Barlow Condensed", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(z.name.toUpperCase(), z.x + z.w / 2, z.y + 42);
    }

    // Quadrangle grass & stone fountain details
    ctx.fillStyle = '#173028';
    ctx.fillRect(860, 670, 220, 140);
    ctx.fillRect(1320, 670, 220, 140);
    ctx.fillRect(860, 990, 220, 140);
    ctx.fillRect(1320, 990, 220, 140);

    // Fountain water ring around center pillar
    const pulse = (performance.now() * 0.002) % 1;
    ctx.strokeStyle = `rgba(56, 189, 248, ${0.45 - pulse * 0.35})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(1200, 900, 74 + pulse * 18, 0, Math.PI * 2);
    ctx.stroke();

    // Basketball court markings in Sports Zone
    ctx.strokeStyle = 'rgba(249, 115, 22, 0.35)';
    ctx.lineWidth = 2;
    ctx.strokeRect(1680, 780, 520, 280);
    ctx.beginPath();
    ctx.arc(1940, 920, 48, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(1940, 780);
    ctx.lineTo(1940, 1060);
    ctx.stroke();
  }

  private drawExtractionZones(ctx: CanvasRenderingContext2D): void {
    const t = performance.now() * 0.003;
    for (const route of Object.values(ESCAPE_ROUTES)) {
      const rParts = this.parts.filter((pt) => pt.routeId === route.id);
      const ready = rParts.every((pt) => pt.collected);
      const isTracked = this.trackedRoute === route.id;

      ctx.save();
      ctx.translate(route.extractionX, route.extractionY);

      // Pulsing extraction pad
      ctx.strokeStyle = ready ? route.accentColor : `${route.accentColor}66`;
      ctx.lineWidth = ready ? 3 : 2;
      ctx.beginPath();
      ctx.arc(0, 0, 38 + Math.sin(t) * (ready ? 5 : 2), 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = ready ? `${route.accentColor}30` : `${route.accentColor}12`;
      ctx.beginPath();
      ctx.arc(0, 0, 34, 0, Math.PI * 2);
      ctx.fill();

      // Icon marker per route
      ctx.fillStyle = ready ? '#ffffff' : '#cbd5e1';
      ctx.font = '700 13px "Barlow Condensed", sans-serif';
      ctx.textAlign = 'center';
      const badge =
        route.id === 'bus'
          ? 'BUS EXIT'
          : route.id === 'chopper'
            ? 'HELIPAD'
            : route.id === 'tunnel'
              ? 'DRAIN HATCH'
              : 'GLIDER RAMP';
      ctx.fillText(badge, 0, 4);

      if (isTracked || ready) {
        ctx.fillStyle = route.accentColor;
        ctx.font = '600 11px "Plus Jakarta Sans", sans-serif';
        ctx.fillText(ready ? 'READY [E]' : route.shortTitle, 0, -44);
      }

      ctx.restore();
    }
  }

  private drawStations(ctx: CanvasRenderingContext2D): void {
    for (const st of this.stations) {
      const available = st.cooldown <= 0 && !(st.kind === 'weapon_crate' && st.usedOnce);
      ctx.save();
      ctx.translate(st.x, st.y);

      const baseColor =
        st.kind === 'chai'
          ? '#10b981'
          : st.kind === 'coffee'
            ? '#f59e0b'
            : st.kind === 'alarm'
              ? '#ef4444'
              : st.kind === 'weapon_crate'
                ? '#38bdf8'
                : '#cbd5e1';

      ctx.fillStyle = available ? `${baseColor}28` : 'rgba(51, 65, 85, 0.25)';
      ctx.strokeStyle = available ? baseColor : '#475569';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(-16, -16, 32, 32, 6);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = available ? '#f8fafc' : '#64748b';
      ctx.font = '700 11px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      const iconText =
        st.kind === 'chai'
          ? 'CHAI'
          : st.kind === 'coffee'
            ? 'BREW'
            : st.kind === 'alarm'
              ? 'BELL'
              : st.kind === 'weapon_crate'
                ? 'TECH'
                : 'BOX';
      ctx.fillText(iconText, 0, 4);

      ctx.restore();
    }
  }

  private drawParts(ctx: CanvasRenderingContext2D): void {
    const t = performance.now() * 0.004;
    for (const part of this.parts) {
      if (part.collected) continue;
      const isTracked = part.routeId === this.trackedRoute;
      const bob = Math.sin(t + part.x * 0.01) * 3;

      ctx.save();
      ctx.translate(part.x, part.y + bob);

      // Glow ring
      ctx.fillStyle = `${part.color}28`;
      ctx.beginPath();
      ctx.arc(0, 0, isTracked ? 22 : 16, 0, Math.PI * 2);
      ctx.fill();

      // Diamond item core
      ctx.rotate(Math.PI / 4);
      ctx.fillStyle = part.color;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.fillRect(-9, -9, 18, 18);
      ctx.strokeRect(-9, -9, 18, 18);
      ctx.rotate(-Math.PI / 4);

      ctx.fillStyle = '#f8fafc';
      ctx.font = '600 11px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(part.name, 0, -24);

      ctx.restore();
    }
  }

  private drawDrops(ctx: CanvasRenderingContext2D): void {
    for (const d of this.drops) {
      const y = d.y + Math.sin(d.bobPhase) * 2.5;
      const color =
        d.kind === 'medkit'
          ? '#4ade80'
          : d.kind === 'ammo'
            ? '#fde047'
            : d.kind === 'battery'
              ? '#38bdf8'
              : '#fb923c';

      ctx.fillStyle = '#0f172a';
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(d.x, y, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = color;
      ctx.font = '700 11px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      const sym = d.kind === 'medkit' ? '+' : d.kind === 'ammo' ? 'A' : d.kind === 'battery' ? 'Z' : 'Q';
      ctx.fillText(sym, d.x, y + 4);
    }
  }

  private drawBarrels(ctx: CanvasRenderingContext2D): void {
    for (const b of this.barrels) {
      if (b.exploded) continue;
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.fillStyle = b.hitFlash > 0 ? '#ffffff' : '#dc2626';
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, b.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#fef08a';
      ctx.font = '700 10px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('FUEL', 0, 3);
      ctx.restore();
    }
  }

  private drawWallsAndProps(ctx: CanvasRenderingContext2D): void {
    for (const w of this.walls) {
      if (w.kind === 'bus_hull') {
        // Draw iconic BMSIT Green & Yellow Campus Bus
        ctx.fillStyle = '#15803d';
        ctx.fillRect(w.x, w.y, w.w, w.h);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(w.x, w.y + w.h - 10, w.w, 6);
        ctx.fillStyle = '#bae6fd';
        ctx.fillRect(w.x + 10, w.y + 8, 22, w.h - 20);
        ctx.fillRect(w.x + w.w - 28, w.y + 8, 20, w.h - 20);
        ctx.fillStyle = '#ffffff';
        ctx.font = '700 11px "Barlow Condensed", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('BMSIT SHUTTLE', w.x + w.w / 2, w.y + 28);
        continue;
      }

      if (w.kind === 'shelf') {
        ctx.fillStyle = '#4a3525';
      } else if (w.kind === 'bench') {
        ctx.fillStyle = '#2d3748';
      } else if (w.kind === 'pillar') {
        ctx.fillStyle = '#334155';
      } else if (w.kind === 'fence') {
        ctx.fillStyle = '#1e293b';
      } else {
        ctx.fillStyle = '#2a3444';
      }

      ctx.fillRect(w.x, w.y, w.w, w.h);
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(w.x, w.y, w.w, w.h);
    }

    // Streetlamp posts
    for (const lamp of this.lamps) {
      ctx.fillStyle = '#fde68a';
      ctx.beginPath();
      ctx.arc(lamp.x, lamp.y, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private drawAcidPools(ctx: CanvasRenderingContext2D): void {
    for (const pool of this.acidPools) {
      const alpha = Math.min(1, pool.life / 1.5) * 0.42;
      ctx.fillStyle = `rgba(132, 204, 22, ${alpha})`;
      ctx.beginPath();
      ctx.arc(pool.x, pool.y, pool.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = `rgba(190, 242, 100, ${alpha * 1.2})`;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  private drawDecoys(ctx: CanvasRenderingContext2D): void {
    const t = performance.now() * 0.01;
    for (const dec of this.decoys) {
      ctx.fillStyle = '#fb923c';
      ctx.beginPath();
      ctx.arc(dec.x, dec.y, 6, 0, Math.PI * 2);
      ctx.fill();

      const ringR = 12 + ((t * 18) % 36);
      ctx.strokeStyle = 'rgba(251, 146, 60, 0.65)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(dec.x, dec.y, ringR, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  private drawZombies(ctx: CanvasRenderingContext2D): void {
    for (const z of this.zombies) {
      ctx.save();
      ctx.translate(z.x, z.y);

      // Telegraphs
      if (z.state === 'windup') {
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(0, 0, z.radius + 9, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = '#ef4444';
        ctx.font = '700 16px "Barlow Condensed", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('!', 0, -z.radius - 8);
      } else if (z.state === 'slam') {
        const pct = 1 - z.stateTimer / 0.65;
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.85)';
        ctx.fillStyle = 'rgba(239, 68, 68, 0.16)';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(0, 0, 98 * pct, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      } else if (z.state === 'spit_windup') {
        ctx.strokeStyle = '#a3e635';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(0, 0, z.radius + 8, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.rotate(z.angle);
      ctx.scale(z.squash, 2 - z.squash);

      const bodyColor =
        z.hitFlash > 0
          ? '#ffffff'
          : z.type === 'sprinter'
            ? '#dc2626'
            : z.type === 'brute'
              ? '#7c2d12'
              : z.type === 'spitter'
                ? '#65a30d'
                : '#2e6f56';

      // Outstretched zombie arms
      ctx.fillStyle = z.hitFlash > 0 ? '#ffffff' : '#84a98c';
      ctx.fillRect(z.radius * 0.35, -z.radius * 0.72, z.radius * 0.9, 5);
      ctx.fillRect(z.radius * 0.35, z.radius * 0.42, z.radius * 0.9, 5);

      // Body circle
      ctx.fillStyle = bodyColor;
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, z.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Glowing eyes
      ctx.fillStyle = z.type === 'spitter' ? '#d9f99d' : '#fca5a5';
      ctx.beginPath();
      ctx.arc(z.radius * 0.45, -4, 2.2, 0, Math.PI * 2);
      ctx.arc(z.radius * 0.45, 4, 2.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      // Health bar if damaged
      if (z.hp < z.maxHp) {
        const bw = z.radius * 2;
        ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
        ctx.fillRect(z.x - bw / 2, z.y - z.radius - 10, bw, 4);
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(z.x - bw / 2, z.y - z.radius - 10, bw * Math.max(0, z.hp / z.maxHp), 4);
      }
    }
  }

  private drawNpcs(ctx: CanvasRenderingContext2D): void {
    const t = performance.now() * 0.005;
    for (const npc of this.npcs) {
      ctx.save();
      ctx.translate(npc.x, npc.y);

      // Help beacon ring for unrescued friends
      if (!npc.rescued) {
        ctx.strokeStyle = `rgba(250, 204, 21, ${0.5 + Math.sin(t) * 0.35})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, 24 + Math.sin(t) * 4, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Human avatar (rotated)
      ctx.save();
      ctx.rotate(npc.angle);

      // Shoulders / college hoodie
      ctx.fillStyle = npc.shirtColor;
      ctx.strokeStyle = '#f8fafc';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.roundRect(-10, -13, 20, 26, 8);
      ctx.fill();
      ctx.stroke();

      // Helper weapon if rescued
      if (npc.rescued && !npc.isStationaryVendor) {
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(8, 3, 14, 4);
      }

      // Human head + hair
      ctx.fillStyle = npc.skinColor;
      ctx.beginPath();
      ctx.arc(2, 0, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = npc.hairColor;
      ctx.beginPath();
      ctx.arc(-1, 0, 8.5, Math.PI * 0.55, Math.PI * 1.45);
      ctx.fill();
      ctx.restore();

      // Nameplate
      ctx.fillStyle = npc.rescued ? '#e2e8f0' : '#fde047';
      ctx.font = '700 11px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(npc.rescued ? npc.name : `${npc.name} (HELP!)`, 0, -24);

      // Comic speech bubble
      if (npc.speech) {
        ctx.font = '600 11px "Plus Jakarta Sans", sans-serif';
        const tw = ctx.measureText(npc.speech).width + 14;
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(-tw / 2, -52, tw, 20, 6);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#0f172a';
        ctx.fillText(npc.speech, 0, -38);
      }

      ctx.restore();
    }
  }

  private drawPlayer(ctx: CanvasRenderingContext2D): void {
    const p = this.player;

    // On-ground objective guide arrow orbiting player so navigation is effortless
    if (this.phase === 'PLAYING') {
      const trackedDef = ESCAPE_ROUTES[this.trackedRoute];
      const nextPart = this.parts.find((pt) => pt.routeId === this.trackedRoute && !pt.collected);
      const tx = nextPart ? nextPart.x : trackedDef.extractionX;
      const ty = nextPart ? nextPart.y : trackedDef.extractionY;
      const dist = Math.hypot(tx - p.x, ty - p.y);
      if (dist > 70) {
        const ang = Math.atan2(ty - p.y, tx - p.x);
        ctx.save();
        ctx.translate(p.x + Math.cos(ang) * 42, p.y + Math.sin(ang) * 42);
        ctx.rotate(ang);
        ctx.fillStyle = trackedDef.accentColor;
        ctx.beginPath();
        ctx.moveTo(9, 0);
        ctx.lineTo(-5, -5.5);
        ctx.lineTo(-2.5, 0);
        ctx.lineTo(-5, 5.5);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
    }

    ctx.save();
    ctx.translate(p.x, p.y);

    // Bat swing visual arc
    if (p.batSwingTimer > 0) {
      const progress = 1 - p.batSwingTimer / 0.18;
      ctx.strokeStyle = `rgba(251, 191, 36, ${0.85 * (1 - progress)})`;
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.arc(0, 0, 54, p.angle - 1.05, p.angle + 1.05);
      ctx.stroke();
    }

    ctx.rotate(p.angle);
    ctx.scale(p.squash, 2 - p.squash);

    // College backpack
    ctx.fillStyle = '#1e3a8a';
    ctx.fillRect(-p.radius - 3, -9, 8, 18);

    // Student hoodie shoulders
    ctx.fillStyle = p.hitFlash > 0 ? '#ef4444' : '#0284c7';
    ctx.strokeStyle = '#f8fafc';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-10, -14, 20, 28, 9);
    ctx.fill();
    ctx.stroke();

    // Equipped weapon
    if (p.activeWeapon === 'bat') {
      ctx.fillStyle = '#d97706';
      ctx.fillRect(8, 5, 24, 5);
    } else if (p.activeWeapon === 'nailgun') {
      ctx.fillStyle = '#facc15';
      ctx.fillRect(10, 4, 18, 6);
    } else {
      ctx.fillStyle = '#22d3ee';
      ctx.fillRect(10, 3, 20, 8);
    }

    // Human head + hair
    ctx.fillStyle = p.hitFlash > 0 ? '#fca5a5' : '#dba47a';
    ctx.beginPath();
    ctx.arc(3, 0, 9.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#18181b';
    ctx.beginPath();
    ctx.arc(-0.5, 0, 9, Math.PI * 0.55, Math.PI * 1.45);
    ctx.fill();

    ctx.restore();
  }

  private drawProjectiles(ctx: CanvasRenderingContext2D): void {
    for (const proj of this.projectiles) {
      ctx.fillStyle = proj.color;
      ctx.beginPath();
      ctx.arc(proj.x, proj.y, proj.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private drawLightningArcs(ctx: CanvasRenderingContext2D): void {
    for (const arc of this.lightningArcs) {
      if (arc.points.length < 2) continue;
      const alpha = arc.life / arc.maxLife;
      ctx.strokeStyle = `rgba(125, 211, 252, ${alpha})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(arc.points[0].x, arc.points[0].y);
      for (let i = 1; i < arc.points.length; i++) {
        const prev = arc.points[i - 1];
        const curr = arc.points[i];
        const midX = (prev.x + curr.x) / 2 + (Math.random() - 0.5) * 18;
        const midY = (prev.y + curr.y) / 2 + (Math.random() - 0.5) * 18;
        ctx.lineTo(midX, midY);
        ctx.lineTo(curr.x, curr.y);
      }
      ctx.stroke();
    }
  }

  private drawParticles(ctx: CanvasRenderingContext2D): void {
    for (const pt of this.particles) {
      if (!pt.active) continue;
      ctx.globalAlpha = pt.alpha;
      ctx.fillStyle = pt.color;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  private drawFloatingTexts(ctx: CanvasRenderingContext2D): void {
    for (const ft of this.floatingTexts) {
      ctx.globalAlpha = Math.min(1, ft.life / ft.maxLife);
      ctx.fillStyle = ft.color;
      ctx.font = '700 13px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(ft.text, ft.x, ft.y);
    }
    ctx.globalAlpha = 1;
  }

  private renderNightLighting(ctx: CanvasRenderingContext2D, offsetX: number, offsetY: number): void {
    const lctx = this.lightCtx;
    const lw = this.lightCanvas.width;
    const lh = this.lightCanvas.height;
    const scaleX = lw / this.viewW;
    const scaleY = lh / this.viewH;

    lctx.globalCompositeOperation = 'source-over';
    lctx.fillStyle = 'rgba(5, 9, 18, 0.54)';
    lctx.fillRect(0, 0, lw, lh);

    lctx.globalCompositeOperation = 'destination-out';

    // Ambient radius around player
    const px = (this.player.x + offsetX) * scaleX;
    const py = (this.player.y + offsetY) * scaleY;
    const pGrad = lctx.createRadialGradient(px, py, 18 * scaleX, px, py, 185 * scaleX);
    pGrad.addColorStop(0, 'rgba(255,255,255,0.95)');
    pGrad.addColorStop(1, 'rgba(255,255,255,0)');
    lctx.fillStyle = pGrad;
    lctx.beginPath();
    lctx.arc(px, py, 185 * scaleX, 0, Math.PI * 2);
    lctx.fill();

    // Flashlight cone
    lctx.save();
    lctx.translate(px, py);
    lctx.rotate(this.player.angle);
    const coneLen = 420 * scaleX;
    const coneGrad = lctx.createRadialGradient(0, 0, 10, 0, 0, coneLen);
    coneGrad.addColorStop(0, 'rgba(255,255,255,0.95)');
    coneGrad.addColorStop(1, 'rgba(255,255,255,0)');
    lctx.fillStyle = coneGrad;
    lctx.beginPath();
    lctx.moveTo(0, 0);
    lctx.arc(0, 0, coneLen, -0.42, 0.42);
    lctx.closePath();
    lctx.fill();
    lctx.restore();

    // Campus streetlamps & Human ally lights
    const t = performance.now() * 0.008;
    for (const lamp of this.lamps) {
      if (lamp.flicker && Math.sin(t + lamp.x) > 0.78) continue;
      const lx = (lamp.x + offsetX) * scaleX;
      const ly = (lamp.y + offsetY) * scaleY;
      const r = lamp.radius * scaleX;
      const g = lctx.createRadialGradient(lx, ly, r * 0.1, lx, ly, r);
      g.addColorStop(0, 'rgba(255,255,255,0.85)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      lctx.fillStyle = g;
      lctx.beginPath();
      lctx.arc(lx, ly, r, 0, Math.PI * 2);
      lctx.fill();
    }

    for (const npc of this.npcs) {
      const nx = (npc.x + offsetX) * scaleX;
      const ny = (npc.y + offsetY) * scaleY;
      const r = 115 * scaleX;
      const g = lctx.createRadialGradient(nx, ny, r * 0.1, nx, ny, r);
      g.addColorStop(0, 'rgba(255,255,255,0.82)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      lctx.fillStyle = g;
      lctx.beginPath();
      lctx.arc(nx, ny, r, 0, Math.PI * 2);
      lctx.fill();
    }

    ctx.drawImage(this.lightCanvas, 0, 0, this.viewW, this.viewH);
  }

  private drawObjectiveEdgeIndicator(ctx: CanvasRenderingContext2D, offsetX: number, offsetY: number): void {
    const trackedDef = ESCAPE_ROUTES[this.trackedRoute];
    const nextPart = this.parts.find((pt) => pt.routeId === this.trackedRoute && !pt.collected);
    const tx = (nextPart ? nextPart.x : trackedDef.extractionX) + offsetX;
    const ty = (nextPart ? nextPart.y : trackedDef.extractionY) + offsetY;

    // Only draw edge pointer if target is outside middle 80% of screen
    if (tx > 70 && tx < this.viewW - 70 && ty > 70 && ty < this.viewH - 70) return;

    const cx = this.viewW / 2;
    const cy = this.viewH / 2;
    const ang = Math.atan2(ty - cy, tx - cx);
    const r = Math.min(this.viewW, this.viewH) * 0.4;
    const ix = Math.max(48, Math.min(this.viewW - 48, cx + Math.cos(ang) * r));
    const iy = Math.max(82, Math.min(this.viewH - 82, cy + Math.sin(ang) * r));

    ctx.save();
    ctx.translate(ix, iy);
    ctx.rotate(ang);
    ctx.fillStyle = trackedDef.accentColor;
    ctx.strokeStyle = '#0b0f17';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(13, 0);
    ctx.lineTo(-9, -8);
    ctx.lineTo(-5, 0);
    ctx.lineTo(-9, 8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
}
