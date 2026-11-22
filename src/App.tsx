import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AdventureHud } from './components/AdventureHud';
import { AdventureModals } from './components/AdventureModals';
import { AdventureTitleScreen } from './components/AdventureTitleScreen';
import { CartoonScene } from './components/CartoonScene';
import { PuzzleModal } from './components/PuzzleModal';
import { adventureSound } from './game/adventureAudio';
import {
  DIFFICULTY_SETTINGS,
  generateRunConfig,
  getBookLabel,
  getCircuitLabel,
  getFoodLabel,
  getRoomsForConfig,
  getSpookyAmbientLine,
  ITEMS,
  SPOTLIGHT_COLORS,
} from './game/adventureData';
import {
  AdventureDifficulty,
  AdventureScreen,
  CartoonParticle,
  ItemId,
  PeerStudentRuntime,
  PuzzleId,
  RoomDefinition,
  RoomHotspot,
  RoomId,
  RoomZombieRuntime,
  RunConfig,
  SavedProgress,
} from './game/adventureTypes';

const STORAGE_KEY = 'midnight_bmsit_save_v1';

const ZOMBIE_IDLE_GROANS: Record<RoomId, string[]> = {
  classroom: ['*Groooaaan...*', 'Brains... attendance...', '*Shuffle...*'],
  library: ['*Shhhhh... ughhh...*', 'Quiet... brains...', '*Raspy groan...*'],
  robotics: ['*Bzzzt... grrr...*', 'Volt... *groan*', '*Creak...*'],
  canteen: ['*Hungryyyy...*', 'More... chai...', '*Groan...*'],
  auditorium: ['*Bass groan...*', '*Uggghhh...*', '*Stomp...*'],
  gate: ['*Halt... grrr...*', 'No pass... *groan*', '*Watchful rasp...*'],
};

function loadSaved(): SavedProgress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<SavedProgress>;
      return {
        bestScore: Number(parsed.bestScore ?? 0),
        bestTimeRemaining: Number(parsed.bestTimeRemaining ?? 0),
        completions: Number(parsed.completions ?? 0),
        muted: Boolean(parsed.muted ?? false),
      };
    }
  } catch {
    // Ignore storage errors
  }
  return { bestScore: 0, bestTimeRemaining: 0, completions: 0, muted: false };
}

function saveProgress(next: SavedProgress): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Ignore storage errors
  }
}

function makeZombieForRoom(roomId: RoomId, rooms: Record<RoomId, RoomDefinition>): RoomZombieRuntime {
  const def = rooms[roomId];
  return {
    roomId,
    x: (def.zombiePatrolX[0] + def.zombiePatrolX[1]) / 2,
    y: def.zombieY,
    patrolDir: 1,
    state: 'idle',
    stateTimer: 0,
    bubble: null,
    bubbleTimer: 0,
  };
}

function makePeerForRoom(roomId: RoomId, rooms: Record<RoomId, RoomDefinition>): PeerStudentRuntime {
  const def = rooms[roomId];
  const centerZombieX = (def.zombiePatrolX[0] + def.zombiePatrolX[1]) / 2;
  return {
    x: centerZombieX > 50 ? 24 : 78,
    y: 73,
    fleeing: false,
    bubble: null,
    bubbleTimer: 0,
  };
}

export default function App() {
  const [saved, setSaved] = useState<SavedProgress>(() => {
    const s = loadSaved();
    adventureSound.setMuted(s.muted);
    return s;
  });

  const [runConfig, setRunConfig] = useState<RunConfig>(() => generateRunConfig());
  const rooms = useMemo(() => getRoomsForConfig(runConfig), [runConfig]);

  const [screen, setScreen] = useState<AdventureScreen>('TITLE');
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [difficulty, setDifficulty] = useState<AdventureDifficulty>('standard');
  const [roomId, setRoomId] = useState<RoomId>('classroom');

  const [timeRemaining, setTimeRemaining] = useState(DIFFICULTY_SETTINGS.standard.seconds);
  const [noiseLevel, setNoiseLevel] = useState(0);
  const [score, setScore] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [noiseAlerts, setNoiseAlerts] = useState(0);
  const [escapeMethod, setEscapeMethod] = useState<'gate' | 'rope'>('gate');
  const [gameOverReason, setGameOverReason] = useState(
    'Midnight stretched all the way to sunrise before the gate opened!'
  );

  const [inventory, setInventory] = useState<ItemId[]>([]);
  const [selectedItem, setSelectedItem] = useState<ItemId | null>(null);
  const [collectedFlags, setCollectedFlags] = useState<Record<string, boolean>>({});
  const [solvedPuzzles, setSolvedPuzzles] = useState<Record<string, boolean>>({});
  const [powerRestored, setPowerRestored] = useState(false);

  const [playerPos, setPlayerPos] = useState({ x: 22, y: 72 });
  const [isHiding, setIsHiding] = useState(false);
  const [ghostlySightTimer, setGhostlySightTimer] = useState(0);
  const [dialogue, setDialogue] = useState(
    'Click any object to inspect clues, pick up items, and unlock the Corridor Door!'
  );
  const [activePuzzle, setActivePuzzle] = useState<PuzzleId | null>(null);

  const [zombie, setZombie] = useState<RoomZombieRuntime>(() =>
    makeZombieForRoom('classroom', rooms)
  );
  const [peerStudent, setPeerStudent] = useState<PeerStudentRuntime>(() =>
    makePeerForRoom('classroom', rooms)
  );
  const [particles, setParticles] = useState<CartoonParticle[]>([]);

  const nextParticleId = useRef(1);
  const lastInteractionAtRef = useRef(Date.now());
  const ambientSnapshotRef = useRef({
    roomId,
    noiseLevel,
    isHiding,
    activePuzzle,
    playerX: playerPos.x,
    zombieX: zombie.x,
    zombieState: zombie.state,
  });

  useEffect(() => {
    ambientSnapshotRef.current = {
      roomId,
      noiseLevel,
      isHiding,
      activePuzzle,
      playerX: playerPos.x,
      zombieX: zombie.x,
      zombieState: zombie.state,
    };
  }, [roomId, noiseLevel, isHiding, activePuzzle, playerPos.x, zombie.x, zombie.state]);

  const markInteraction = useCallback(() => {
    lastInteractionAtRef.current = Date.now();
  }, []);

  const spawnParticles = useCallback(
    (x: number, y: number, color: string, count = 12, kind: CartoonParticle['kind'] = 'spark') => {
      const batch: CartoonParticle[] = Array.from({ length: count }, () => {
        const ang = Math.random() * Math.PI * 2;
        const spd = 8 + Math.random() * 18;
        return {
          id: nextParticleId.current++,
          x,
          y,
          vx: Math.cos(ang) * spd,
          vy: Math.sin(ang) * spd - 6,
          size: 3 + Math.random() * 4.5,
          color,
          kind,
          life: 0.55 + Math.random() * 0.25,
          maxLife: 0.75,
        };
      });
      setParticles((prev) => [...prev.slice(-40), ...batch]);
    },
    []
  );

  const addItem = useCallback((itemId: ItemId) => {
    setInventory((prev) => (prev.includes(itemId) ? prev : [...prev, itemId]));
  }, []);

  const triggerVictory = useCallback(
    (method: 'gate' | 'rope', bonusScore: number) => {
      const timeBonus = Math.round(timeRemaining * 0.5);
      const finalScore = score + bonusScore + timeBonus;
      setEscapeMethod(method);
      setScore(finalScore);
      adventureSound.playVictory();
      setSaved((prev) => {
        const updated: SavedProgress = {
          bestScore: Math.max(prev.bestScore, finalScore),
          bestTimeRemaining: Math.max(prev.bestTimeRemaining, timeRemaining),
          completions: prev.completions + 1,
          muted: prev.muted,
        };
        saveProgress(updated);
        return updated;
      });
      setScreen('VICTORY');
    },
    [score, timeRemaining]
  );

  const resetRun = useCallback((diff: AdventureDifficulty, targetScreen: AdventureScreen) => {
    const freshConfig = generateRunConfig();
    const freshRooms = getRoomsForConfig(freshConfig);
    setRunConfig(freshConfig);
    setDifficulty(diff);
    setRoomId('classroom');
    setTimeRemaining(DIFFICULTY_SETTINGS[diff].seconds);
    setNoiseLevel(0);
    setScore(0);
    setHintsUsed(0);
    setNoiseAlerts(0);
    setEscapeMethod('gate');
    setInventory([]);
    setSelectedItem(null);
    setCollectedFlags({});
    setSolvedPuzzles({});
    setPowerRestored(false);
    setPlayerPos({ x: 22, y: 72 });
    setIsHiding(false);
    setGhostlySightTimer(0);
    setActivePuzzle(null);
    setZombie(makeZombieForRoom('classroom', freshRooms));
    setPeerStudent(makePeerForRoom('classroom', freshRooms));
    setParticles([]);
    lastInteractionAtRef.current = Date.now();
    setDialogue('New run started! Stay clear of the Zombie and search the School Bag & Blackboard.');
    setScreen(targetScreen);
  }, []);

  const handleToggleMute = useCallback(() => {
    setSaved((prev) => {
      const nextMuted = !prev.muted;
      adventureSound.setMuted(nextMuted);
      const updated = { ...prev, muted: nextMuted };
      saveProgress(updated);
      return updated;
    });
  }, []);

  // Main simulation tick (timer, noise decay, Ghostly Sight countdown, particles, idle atmosphere)
  useEffect(() => {
    if (screen !== 'PLAYING') return;

    lastInteractionAtRef.current = Date.now();

    const timer = window.setInterval(() => {
      const dt = 0.1;

      setGhostlySightTimer((prev) => Math.max(0, prev - dt));

      setTimeRemaining((prev) => {
        if (prev <= dt) {
          adventureSound.playGameOver();
          setGameOverReason('The morning bell rang at 6:00 AM before you reached freedom!');
          setScreen('GAME_OVER');
          return 0;
        }
        return prev - dt;
      });

      const snap = ambientSnapshotRef.current;
      setNoiseLevel((prev) => Math.max(0, prev - (snap.isHiding ? 18 : 5.5) * dt));

      // Idle spooky atmosphere & occasional zombie groan bubble when player pauses
      const now = Date.now();
      let triggeredAmbientNote: string | null = null;
      if (!snap.activePuzzle && now - lastInteractionAtRef.current >= 7500) {
        lastInteractionAtRef.current = now;
        const line = getSpookyAmbientLine(snap.roomId, snap.noiseLevel, snap.isHiding);
        setDialogue(line);
        if (Math.random() < 0.65) {
          const notes = ZOMBIE_IDLE_GROANS[snap.roomId];
          triggeredAmbientNote = notes[Math.floor(Math.random() * notes.length)];
        }
      }

      setParticles((prev) =>
        prev
          .map((pt) => ({
            ...pt,
            x: pt.x + pt.vx * dt,
            y: pt.y + pt.vy * dt,
            vy: pt.vy + 18 * dt,
            life: pt.life - dt,
          }))
          .filter((pt) => pt.life > 0)
      );

      let zombieGotTooClose = false;
      const roomDef = rooms[snap.roomId];
      const [patrolMin, patrolMax] = roomDef.zombiePatrolX;

      // Update Zombie Person (stationary when calm; shambles slowly toward noisy student when alerted)
      setZombie((z) => {
        let nextX = z.x;
        let nextDir = z.patrolDir;
        let nextState = z.state;
        let nextStateTimer = Math.max(0, z.stateTimer - dt);
        let nextBubble = z.bubble;
        let nextBubbleTimer = Math.max(0, z.bubbleTimer - dt);
        if (nextBubbleTimer <= 0) nextBubble = null;

        if (triggeredAmbientNote && !nextBubble && nextState === 'idle') {
          nextBubble = triggeredAmbientNote;
          nextBubbleTimer = 2.2;
        }

        if (nextState === 'alert' && nextStateTimer <= 0) {
          if (!snap.isHiding) {
            nextState = 'approach';
            nextStateTimer = 2.8;
            nextBubble = 'Grrr... student!!';
            nextBubbleTimer = 2.2;
          } else {
            nextState = 'idle';
            nextBubble = '*Groan... lost them*';
            nextBubbleTimer = 1.6;
          }
        } else if (nextState === 'approach') {
          if (snap.isHiding || nextStateTimer <= 0) {
            nextState = 'idle';
            nextStateTimer = 0;
            nextBubble = '*Shuffles back...*';
            nextBubbleTimer = 1.6;
          } else {
            const dx = snap.playerX - z.x;
            nextDir = dx < 0 ? -1 : 1;
            const step = 6.5 * dt;
            if (Math.abs(dx) > 7.5) {
              nextX = Math.min(patrolMax + 10, Math.max(patrolMin - 10, z.x + Math.sign(dx) * step));
            } else {
              zombieGotTooClose = true;
              nextState = 'idle';
              nextStateTimer = 0;
              nextBubble = 'Graaah!!';
              nextBubbleTimer = 1.8;
            }
          }
        } else if (nextState === 'distracted' && nextStateTimer <= 0) {
          nextState = 'idle';
          nextBubble = '*Groan... back on watch*';
          nextBubbleTimer = 1.6;
        }

        return {
          ...z,
          x: nextX,
          patrolDir: nextDir,
          state: nextState,
          stateTimer: nextStateTimer,
          bubble: nextBubble,
          bubbleTimer: nextBubbleTimer,
        };
      });

      if (zombieGotTooClose) {
        const escapeX = snap.zombieX > 50 ? 14 : 84;
        setPlayerPos({ x: escapeX, y: 72 });
        setTimeRemaining((t) => Math.max(5, t - 10));
        adventureSound.playNoiseAlert();
        setDialogue('Too close! The Zombie lunged and you sprinted safely across the room (-10s)!');
      }

      // Fellow BMSIT Student actively runs away from alerted or nearby Zombies
      setPeerStudent((p) => {
        const danger =
          snap.zombieState === 'alert' ||
          snap.zombieState === 'approach' ||
          (snap.zombieState !== 'distracted' && Math.abs(p.x - snap.zombieX) < 22);
        const safeEdgeX = snap.zombieX > 50 ? 10 : 88;
        let nextX = p.x;
        let fleeing = false;
        let nextBubble = p.bubble;
        let nextBubbleTimer = Math.max(0, p.bubbleTimer - dt);
        if (nextBubbleTimer <= 0) nextBubble = null;

        if (danger && Math.abs(p.x - safeEdgeX) > 1.5) {
          fleeing = true;
          nextX = p.x + Math.sign(safeEdgeX - p.x) * 24 * dt;
          if (!nextBubble) {
            nextBubble = 'Zombie!! Run away!';
            nextBubbleTimer = 2.0;
          }
        } else if (danger) {
          fleeing = false;
          if (!nextBubble) {
            nextBubble = 'Stay clear!';
            nextBubbleTimer = 1.5;
          }
        }

        return {
          ...p,
          x: Math.min(90, Math.max(8, nextX)),
          fleeing,
          bubble: nextBubble,
          bubbleTimer: nextBubbleTimer,
        };
      });
    }, 100);

    return () => window.clearInterval(timer);
  }, [screen, rooms]);

  // Keyboard shortcuts: Escape pause + Arrow/A-D walk
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Escape') {
        if (activePuzzle) {
          setActivePuzzle(null);
        } else if (showHowToPlay) {
          setShowHowToPlay(false);
        } else if (screen === 'PLAYING') {
          setScreen('PAUSED');
        } else if (screen === 'PAUSED') {
          setScreen('PLAYING');
        }
      }
      if (screen === 'PLAYING' && !activePuzzle) {
        if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
          markInteraction();
          setIsHiding(false);
          setPlayerPos((p) => ({ ...p, x: Math.max(8, p.x - 5) }));
        } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
          markInteraction();
          setIsHiding(false);
          setPlayerPos((p) => ({ ...p, x: Math.min(88, p.x + 5) }));
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [screen, activePuzzle, showHowToPlay, markInteraction]);

  const triggerNoise = useCallback(
    (rawAmount: number, reason: string) => {
      const mult = DIFFICULTY_SETTINGS[difficulty].noiseMultiplier;
      const delta = rawAmount * mult;
      setNoiseLevel((prev) => {
        const next = Math.min(100, prev + delta);
        if (next >= 70 && prev < 70) {
          adventureSound.playNoiseAlert();
          setNoiseAlerts((n) => n + 1);
          setScore((s) => Math.max(0, s - 15));
          setZombie((z) => ({
            ...z,
            state: z.state === 'distracted' ? 'distracted' : 'alert',
            stateTimer: 2.0,
            bubble: z.roomId === 'library' ? 'SHHH!! Too loud!' : 'Who is there?!',
            bubbleTimer: 2.4,
          }));
          if (roomId === 'library') adventureSound.playShhh();
        }
        if (next >= 98 && !isHiding) {
          setTimeRemaining((t) => Math.max(5, t - 15));
          setIsHiding(true);
          setDialogue(`${reason} You ducked into cover just in time (-15s)!`);
          return 20;
        }
        return next;
      });
    },
    [difficulty, roomId, isHiding]
  );

  const advanceToRoom = useCallback(
    (nextRoom: RoomId, spawnX = 16) => {
      adventureSound.playDoorUnlock();
      setScore((s) => s + 100);
      setSelectedItem(null);
      setGhostlySightTimer(0);
      setRoomId(nextRoom);
      setZombie(makeZombieForRoom(nextRoom, rooms));
      setPeerStudent(makePeerForRoom(nextRoom, rooms));
      setPlayerPos({ x: spawnX, y: 70 });
      lastInteractionAtRef.current = Date.now();
      setScreen('LEVEL_TRANSITION');
    },
    [rooms]
  );

  const handleHotspotClick = useCallback(
    (spot: RoomHotspot) => {
      markInteraction();
      setIsHiding(false);
      setPlayerPos({
        x: Math.min(82, Math.max(12, spot.x + spot.w / 2)),
        y: Math.min(78, Math.max(58, spot.y + spot.h * 0.5)),
      });

      const cx = spot.x + spot.w / 2;
      const cy = spot.y + spot.h / 2;
      const hasTorch = inventory.includes('torch') || selectedItem === 'torch';

      // Safe hiding spots
      if (spot.kind === 'hide') {
        adventureSound.playTap();
        setIsHiding(true);
        setDialogue(`Tucked safely inside ${spot.label.replace(' (Hide)', '')}. Noise is dropping!`);
        spawnParticles(cx, cy, '#34d399', 8, 'dust');
        return;
      }

      // Hidden Stickers (works automatically if Torch is in Backpack or selected)
      if (spot.kind === 'sticker') {
        if (collectedFlags[spot.id]) {
          setDialogue('Already collected the hidden BMSIT sticker here!');
          return;
        }
        if (spot.darkHidden && !hasTorch) {
          adventureSound.playTap();
          setDialogue('Something glints faintly in the dark... Grab your Small Torch from the School Bag!');
          return;
        }
        adventureSound.playPickup();
        setCollectedFlags((prev) => ({ ...prev, [spot.id]: true }));
        setScore((s) => s + 25);
        spawnParticles(cx, cy, '#fde047', 16, 'star');
        setDialogue('Found a Hidden BMSIT Night-Owl Sticker! (+25 pts)');
        return;
      }

      // STAGE 1: CLASSROOM
      if (spot.id === 'blackboard') {
        const [c1, c2, c3] = runConfig.classroomClues;
        adventureSound.playTap();
        setDialogue(`Blackboard Clue: "Attendance = ${c1}, Chalks = ${c2}, Midnight Periods = ${c3}" → Code: ${runConfig.classroomCode}!`);
        return;
      }
      if (spot.id === 'wall_clock') {
        adventureSound.playTap();
        setDialogue('The clock stopped at 12:00 AM. Still earlier than most project submissions.');
        return;
      }
      if (spot.id === 'school_bag') {
        if (collectedFlags.school_bag) {
          setDialogue('Your school bag only has half-eaten biscuits left.');
          return;
        }
        adventureSound.playPickup();
        setCollectedFlags((prev) => ({ ...prev, school_bag: true }));
        addItem('torch');
        addItem('folded_note');
        spawnParticles(cx, cy, '#fbbf24', 14, 'spark');
        setDialogue('Grabbed your Small Torch and Folded Note from the School Bag!');
        return;
      }
      if (spot.id === 'teacher_desk') {
        if (solvedPuzzles.classroom_code) {
          setDialogue('The desk drawer is unlocked and empty.');
        } else {
          adventureSound.playTap();
          setActivePuzzle('classroom_code');
        }
        return;
      }
      if (spot.id === 'loose_books') {
        spawnParticles(cx, cy, '#f87171', 10, 'dust');
        triggerNoise(20, 'You bumped the scattered textbooks!');
        setDialogue('Thud! Bumping the loose books raised the Noise Meter slightly.');
        return;
      }
      if (spot.id === 'corridor_door') {
        if (inventory.includes('classroom_key')) {
          setSolvedPuzzles((prev) => ({ ...prev, door_classroom: true }));
          advanceToRoom('library');
        } else {
          adventureSound.playError();
          setDialogue("Locked! Unlock the Teacher's Desk drawer first to get the Classroom Key.");
        }
        return;
      }

      // STAGE 2: LIBRARY
      if (spot.id === 'reading_table') {
        const bookText = runConfig.libraryOrder.map(getBookLabel).join(' → ');
        if (collectedFlags.reading_table) {
          setDialogue(`Note on table: "Arrange books in order: ${bookText}."`);
          return;
        }
        adventureSound.playPickup();
        setCollectedFlags((prev) => ({ ...prev, reading_table: true }));
        addItem('torn_map');
        spawnParticles(cx, cy, '#fb923c', 14, 'spark');
        setDialogue(`Found Torn Campus Map! Reading note says: "${bookText}."`);
        return;
      }
      if (spot.id === 'librarian_desk') {
        if (hasTorch) {
          adventureSound.playPickup();
          setDialogue('Torchlight shows a sticky note: "Archive holds the Power Fuse & Card Frag A!"');
        } else {
          adventureSound.playTap();
          setDialogue('Too dark to read the sticky note on the desk.');
        }
        return;
      }
      if (spot.id === 'bookshelves') {
        if (solvedPuzzles.library_books) {
          setDialogue('The 3 marked books clicked into place and unlocked the Archive Cabinet!');
        } else {
          adventureSound.playTap();
          setActivePuzzle('library_books');
        }
        return;
      }
      if (spot.id === 'archive_cabinet') {
        if (!solvedPuzzles.library_books) {
          adventureSound.playError();
          setDialogue('Archive Cabinet is locked! Arrange the Marked Bookshelves first.');
          return;
        }
        if (collectedFlags.archive_cabinet) {
          setDialogue('Already took the Power Fuse and Access-Card Fragment A.');
          return;
        }
        adventureSound.playPickup();
        setCollectedFlags((prev) => ({ ...prev, archive_cabinet: true }));
        addItem('fuse');
        addItem('card_frag_a');
        spawnParticles(cx, cy, '#38bdf8', 18, 'star');
        setDialogue('Awesome! Collected the Power Fuse and Access-Card Fragment A!');
        return;
      }
      if (spot.id === 'robotics_door') {
        if (collectedFlags.archive_cabinet) {
          setSolvedPuzzles((prev) => ({ ...prev, door_library: true }));
          advanceToRoom('robotics');
        } else {
          adventureSound.playError();
          setDialogue('Grab the Power Fuse & Card Fragment A from the Archive Cabinet first!');
        }
        return;
      }

      // STAGE 3: ROBOTICS LAB
      if (spot.id === 'printer_3d') {
        if (collectedFlags.printer_3d) {
          setDialogue('The 3D printer bed is empty.');
          return;
        }
        adventureSound.playPickup();
        setCollectedFlags((prev) => ({ ...prev, printer_3d: true }));
        addItem('plastic_gear');
        spawnParticles(cx, cy, '#22d3ee', 16, 'spark');
        setDialogue('Grabbed a 3D-Printed Gear! Click the Drone Workbench to wire your Mini Drone.');
        return;
      }
      if (spot.id === 'blueprint_wall') {
        const orderStr = runConfig.circuitOrder.map(getCircuitLabel).join(' → ');
        adventureSound.playTap();
        setDialogue(`Drone Blueprint for this run: "${orderStr}."`);
        return;
      }
      if (spot.id === 'drone_crate') {
        if (solvedPuzzles.robotics_circuit) {
          setDialogue('Your Mini Distraction Drone is already built and inside your Backpack!');
          return;
        }
        if (!inventory.includes('plastic_gear')) {
          adventureSound.playError();
          setDialogue('Grab the 3D-Printed Gear from the 3D Printer Station first!');
          return;
        }
        adventureSound.playTap();
        setActivePuzzle('robotics_circuit');
        return;
      }
      if (spot.id === 'sparking_cable') {
        adventureSound.playError();
        spawnParticles(cx, cy, '#facc15', 14, 'spark');
        triggerNoise(18, 'ZAP! Brushed the loose extension cord!');
        setDialogue('Careful! Brushing the loose extension cord made a sharp buzz!');
        return;
      }
      if (spot.id === 'canteen_door') {
        if (!solvedPuzzles.robotics_circuit) {
          adventureSound.playError();
          setDialogue('Wire the Drone Workbench to build your Mini Drone before heading to the Canteen!');
          return;
        }
        setSolvedPuzzles((prev) => ({ ...prev, door_robotics: true }));
        advanceToRoom('canteen', 14);
        return;
      }

      // STAGE 4: CANTEEN
      if (spot.id === 'menu_board') {
        const comboStr = runConfig.canteenOrder
          .map((f, idx) => `${idx + 1}. ${getFoodLabel(f)}`)
          .join(' → ');
        adventureSound.playTap();
        setDialogue(`Menu Board Combo: "${comboStr}."`);
        return;
      }
      if (spot.id === 'tray_stack') {
        if (collectedFlags.tray_stack) {
          setDialogue('Only crumbs left on the serving counter.');
          return;
        }
        adventureSound.playPickup();
        setCollectedFlags((prev) => ({ ...prev, tray_stack: true }));
        addItem('plastic_tray');
        addItem('chai_flask');
        spawnParticles(cx, cy, '#f472b6', 16, 'spark');
        setDialogue('Picked up Plastic Tray + Hot Chai Flask! (Sip Chai anytime for -35% Noise!)');
        return;
      }
      if (spot.id === 'kitchen_decoy_spot') {
        if (inventory.includes('plastic_tray')) {
          adventureSound.playDistract();
          spawnParticles(cx, cy, '#f472b6', 16, 'star');
          setZombie((z) => ({
            ...z,
            x: 74,
            state: 'distracted',
            stateTimer: 14,
            bubble: 'Who dropped a tray?!',
            bubbleTimer: 4,
          }));
          setSelectedItem(null);
          setDialogue('CLATTER! The Zombie Chef is shambling over to check the Kitchen Door!');
        } else {
          adventureSound.playTap();
          setDialogue('Kitchen Door: Pick up the Plastic Tray from the counter to distract the Zombie Chef!');
        }
        return;
      }
      if (spot.id === 'spilled_juice') {
        adventureSound.playError();
        spawnParticles(cx, cy, '#fb923c', 12, 'dust');
        triggerNoise(14, 'Squish! Stepped near the spilled mango juice.');
        setDialogue('Sticky floor! Stepped right on the mango juice spill.');
        return;
      }
      if (spot.id === 'kitchen_hatch') {
        if (solvedPuzzles.canteen_sequence) {
          setDialogue('Already collected Access-Card Fragment B from the Kitchen Locker.');
          return;
        }
        adventureSound.playTap();
        setActivePuzzle('canteen_sequence');
        return;
      }
      if (spot.id === 'auditorium_door') {
        if (collectedFlags.canteen_sequence) {
          setSolvedPuzzles((prev) => ({ ...prev, door_canteen: true }));
          advanceToRoom('auditorium');
        } else {
          adventureSound.playError();
          setDialogue('Open the Kitchen Locker first to get Access-Card Fragment B!');
        }
        return;
      }

      // STAGE 5: AUDITORIUM BACKSTAGE
      if (spot.id === 'stage_poster') {
        const colStr = runConfig.auditoriumColors.map((c) => SPOTLIGHT_COLORS[c].label).join(' · ');
        adventureSound.playTap();
        setDialogue(`Utsaha Fest Poster shows today's spotlight lineup: "${colStr}."`);
        return;
      }
      if (spot.id === 'spotlight_console') {
        if (solvedPuzzles.auditorium_lights) {
          setDialogue('Stage spotlights are set! Grab the Grappling Rope & Keys from the Drama Prop Trunk.');
        } else {
          adventureSound.playTap();
          setActivePuzzle('auditorium_lights');
        }
        return;
      }
      if (spot.id === 'prop_trunk') {
        if (!solvedPuzzles.auditorium_lights) {
          adventureSound.playError();
          setDialogue('Set the Stage Spotlights at the Light Console first to unlock the Drama Prop Trunk!');
          return;
        }
        if (collectedFlags.prop_trunk) {
          setDialogue('Already collected the Stage Grappling Rope and Backstage Keyring.');
          return;
        }
        adventureSound.playPickup();
        setCollectedFlags((prev) => ({ ...prev, prop_trunk: true }));
        addItem('grappling_rope');
        addItem('security_keyring');
        spawnParticles(cx, cy, '#f59e0b', 18, 'star');
        setDialogue('Grabbed Stage Grappling Rope & Backstage Keyring! Head out to the Main Gate!');
        return;
      }
      if (spot.id === 'mic_cables') {
        adventureSound.playError();
        spawnParticles(cx, cy, '#fb7185', 10, 'dust');
        triggerNoise(18, 'Feedback buzz from the mic cables!');
        setDialogue('Microphone shriek! Watch out for tangled stage cables.');
        return;
      }
      if (spot.id === 'gate_corridor_door') {
        if (inventory.includes('security_keyring')) {
          setSolvedPuzzles((prev) => ({ ...prev, door_auditorium: true }));
          advanceToRoom('gate');
        } else {
          adventureSound.playError();
          setDialogue('Locked! Grab the Backstage Keyring from the Drama Prop Trunk.');
        }
        return;
      }

      // STAGE 6: MAIN CORRIDOR & GATE
      if (spot.id === 'noticeboard') {
        adventureSound.playTap();
        setDialogue(`Security Noticeboard: "Night Override PIN: ${runConfig.gateCode}".`);
        return;
      }
      if (spot.id === 'security_desk') {
        if (inventory.includes('mini_drone')) {
          adventureSound.playDistract();
          spawnParticles(cx, cy, '#38bdf8', 20, 'star');
          setInventory((prev) => prev.filter((id) => id !== 'mini_drone'));
          setSelectedItem(null);
          setZombie((z) => ({
            ...z,
            x: 45,
            state: 'distracted',
            stateTimer: 16,
            bubble: 'Wait—is that a drone?!',
            bubbleTimer: 5,
          }));
          setScore((s) => s + 60);
          setDialogue('BZZZT! Your Mini Drone distracted the Zombie Guard (+60 pts)! Escape via Gate OR Watchtower!');
        } else {
          adventureSound.playTap();
          setDialogue('Security Desk: Check the Noticeboard PIN or climb the Watchtower Wall with your Rope!');
        }
        return;
      }
      if (spot.id === 'fuse_box') {
        if (powerRestored) {
          setDialogue('Power is humming smoothly! Enter the Noticeboard PIN at the Gate Control Panel.');
          return;
        }
        if (inventory.includes('fuse')) {
          adventureSound.playPowerOn();
          setPowerRestored(true);
          setSelectedItem(null);
          setScore((s) => s + 50);
          spawnParticles(cx, cy, '#34d399', 18, 'star');
          setDialogue('ZAP! Power Fuse installed — the Gate Control Panel is online!');
        } else {
          adventureSound.playError();
          setDialogue('Power is off! Need the Power Fuse from the Central Library.');
        }
        return;
      }
      if (spot.id === 'watchtower_hook') {
        if (!inventory.includes('grappling_rope')) {
          adventureSound.playError();
          setDialogue('High Watchtower anchor! You would need the Stage Grappling Rope to climb over.');
          return;
        }
        spawnParticles(cx, cy, '#fbbf24', 24, 'confetti');
        triggerVictory('rope', 180);
        return;
      }
      if (spot.id === 'gate_panel' || spot.id === 'main_gate') {
        adventureSound.playTap();
        setActivePuzzle('gate_code');
        return;
      }

      if (selectedItem) {
        adventureSound.playError();
        setDialogue("That probably won't work here.");
      }
    },
    [
      markInteraction,
      inventory,
      selectedItem,
      collectedFlags,
      solvedPuzzles,
      runConfig,
      powerRestored,
      spawnParticles,
      triggerNoise,
      addItem,
      advanceToRoom,
      triggerVictory,
    ]
  );

  const handleSolvePuzzle = useCallback(
    (puzzleId: PuzzleId) => {
      markInteraction();
      adventureSound.playPuzzleSolve();
      setActivePuzzle(null);
      setSolvedPuzzles((prev) => ({ ...prev, [puzzleId]: true }));
      setScore((s) => s + 50);

      if (puzzleId === 'classroom_code') {
        addItem('classroom_key');
        spawnParticles(45, 58, '#34d399', 20, 'star');
        setDialogue('Drawer unlocked! Grabbed the Classroom Key—click the Corridor Door to advance!');
      } else if (puzzleId === 'library_books') {
        spawnParticles(22, 35, '#fbbf24', 20, 'star');
        setDialogue('Click! The 3 books slid in and unlocked the Archive Cabinet!');
      } else if (puzzleId === 'robotics_circuit') {
        setInventory((prev) => [...prev.filter((id) => id !== 'plastic_gear'), 'mini_drone']);
        setSelectedItem(null);
        spawnParticles(56, 52, '#38bdf8', 22, 'star');
        setDialogue('Awesome! Built the Mini Distraction Drone! Step through the Canteen Passage.');
      } else if (puzzleId === 'canteen_sequence') {
        const hasFragA = inventory.includes('card_frag_a');
        if (hasFragA) {
          setInventory((prev) => [
            ...prev.filter((id) => id !== 'card_frag_a' && id !== 'card_frag_b'),
            'full_access_card',
          ]);
          setScore((s) => s + 30);
          setDialogue('Kitchen Locker opened! Fragment A + B snapped together into your Full Gate Access Card!');
        } else {
          addItem('card_frag_b');
          setDialogue('Kitchen Locker opened! Collected Access-Card Fragment B!');
        }
        setCollectedFlags((prev) => ({ ...prev, canteen_sequence: true }));
        spawnParticles(26, 55, '#a78bfa', 22, 'star');
      } else if (puzzleId === 'auditorium_lights') {
        setZombie((z) => ({
          ...z,
          state: 'distracted',
          stateTimer: 18,
          bubble: 'Cool stage lights!',
          bubbleTimer: 5,
        }));
        spawnParticles(50, 32, '#fde047', 24, 'confetti');
        setDialogue('Spotlights matched! Open the Drama Prop Trunk now for your Rope & Stage Keys!');
      } else if (puzzleId === 'gate_code') {
        triggerVictory('gate', 150);
      }
    },
    [markInteraction, addItem, spawnParticles, inventory, triggerVictory]
  );

  const handleCombineCards = useCallback(() => {
    if (!inventory.includes('card_frag_a') || !inventory.includes('card_frag_b')) return;
    markInteraction();
    adventureSound.playPuzzleSolve();
    setInventory((prev) => [
      ...prev.filter((id) => id !== 'card_frag_a' && id !== 'card_frag_b'),
      'full_access_card',
    ]);
    setSelectedItem('full_access_card');
    setScore((s) => s + 30);
    setDialogue('Snapped Fragment A + B together into the Full Gate Access Card!');
  }, [inventory, markInteraction]);

  const handleDrinkChai = useCallback(() => {
    if (!inventory.includes('chai_flask')) return;
    markInteraction();
    adventureSound.playPowerOn();
    setInventory((prev) => prev.filter((id) => id !== 'chai_flask'));
    if (selectedItem === 'chai_flask') setSelectedItem(null);
    setNoiseLevel((prev) => Math.max(0, prev - 35));
    spawnParticles(playerPos.x, playerPos.y - 6, '#34d399', 16, 'heart');
    setDialogue('Aaaah! Warm BMSIT Masala Chai steadied your nerves (-35% Noise)!');
  }, [inventory, markInteraction, selectedItem, spawnParticles, playerPos.x, playerPos.y]);

  const handleUseHint = useCallback(() => {
    markInteraction();
    const hints = rooms[roomId].hints;
    const msg = hints[hintsUsed % hints.length];
    adventureSound.playTap();
    setHintsUsed((h) => h + 1);
    setScore((s) => Math.max(0, s - 10));
    setDialogue(`Hint: ${msg}`);
  }, [rooms, roomId, hintsUsed, markInteraction]);

  const handleToggleGhostlySight = useCallback(() => {
    if (screen !== 'PLAYING') return;
    markInteraction();
    if (ghostlySightTimer > 0) {
      adventureSound.playTap();
      setGhostlySightTimer(0);
      setDialogue('Ghostly Sight dismissed early.');
      return;
    }
    const timePenalty = Math.max(1, Math.round(timeRemaining * 0.1));
    setTimeRemaining((prev) => Math.max(1, prev * 0.9));
    setGhostlySightTimer(3.0);
    adventureSound.playGhostlySight();
    spawnParticles(playerPos.x, playerPos.y - 6, '#22d3ee', 18, 'star');
    setDialogue(
      `Ghostly Sight enabled! All interactive hotspots glow for 3 seconds (-${timePenalty}s spooky power cost).`
    );
  }, [screen, markInteraction, ghostlySightTimer, timeRemaining, spawnParticles, playerPos.x, playerPos.y]);

  const handleFloorClick = useCallback(
    (xPercent: number) => {
      if (screen !== 'PLAYING' || activePuzzle) return;
      markInteraction();
      setIsHiding(false);
      const targetX = Math.min(90, Math.max(8, xPercent));
      setPlayerPos({ x: targetX, y: 72 });
      spawnParticles(targetX, 76, '#cbd5e1', 6, 'dust');
      adventureSound.playTap();

      if (zombie.state === 'alert' || zombie.state === 'approach') {
        const farEnough = Math.abs(targetX - zombie.x) > 26;
        if (farEnough) {
          setZombie((z) => ({
            ...z,
            state: 'idle',
            stateTimer: 0,
            bubble: '*Confused groan...*',
            bubbleTimer: 1.8,
          }));
          setDialogue('Sprinted across the floor and slipped out of the Zombie’s reach!');
        } else {
          setDialogue('Running! Keep moving away from the Zombie!');
        }
      }
    },
    [screen, activePuzzle, markInteraction, spawnParticles, zombie.state, zombie.x]
  );

  const handleRunAway = useCallback(() => {
    if (screen !== 'PLAYING' || activePuzzle) return;
    markInteraction();
    setIsHiding(false);
    const safeX = zombie.x > 50 ? 14 : 84;
    setPlayerPos({ x: safeX, y: 72 });
    spawnParticles(safeX, 72, '#38bdf8', 12, 'dust');
    adventureSound.playTap();
    setZombie((z) => ({
      ...z,
      state: z.state === 'distracted' ? 'distracted' : 'idle',
      stateTimer: 0,
      bubble: 'Graaah... where?!',
      bubbleTimer: 1.8,
    }));
    setPeerStudent((p) => ({
      ...p,
      x: zombie.x > 50 ? 10 : 88,
      fleeing: true,
      bubble: 'Run!!',
      bubbleTimer: 1.8,
    }));
    setDialogue('You and your fellow student sprinted safely away from the Zombie!');
  }, [screen, activePuzzle, markInteraction, zombie.x, spawnParticles]);

  const stickersFound = [
    'classroom_sticker',
    'library_sticker',
    'robotics_sticker',
    'canteen_sticker',
    'auditorium_sticker',
    'gate_sticker',
  ].filter((id) => collectedFlags[id]).length;

  const currentRoomDef = rooms[roomId];

  return (
    <main className="relative w-full min-h-screen bg-[#0b1021] text-slate-100 flex flex-col items-center justify-center overflow-x-hidden">
      {screen === 'TITLE' && (
        <AdventureTitleScreen
          difficulty={difficulty}
          onSelectDifficulty={setDifficulty}
          onStartIntro={() => resetRun(difficulty, 'INTRO')}
          onOpenHowToPlay={() => setShowHowToPlay(true)}
          muted={saved.muted}
          onToggleMute={handleToggleMute}
          saved={saved}
        />
      )}

      {(screen === 'PLAYING' ||
        screen === 'PAUSED' ||
        screen === 'LEVEL_TRANSITION' ||
        screen === 'GAME_OVER' ||
        screen === 'VICTORY') && (
        <AdventureHud
          currentRoom={currentRoomDef}
          timeRemaining={timeRemaining}
          noiseLevel={noiseLevel}
          score={score}
          stickersFound={stickersFound}
          inventory={inventory}
          selectedItem={selectedItem}
          dialogue={dialogue}
          muted={saved.muted}
          ghostlySightTimer={ghostlySightTimer}
          zombieChasing={zombie.state === 'alert' || zombie.state === 'approach'}
          onRunAway={handleRunAway}
          onToggleGhostlySight={handleToggleGhostlySight}
          onSelectItem={(item) => {
            markInteraction();
            adventureSound.playTap();
            setSelectedItem(item);
            if (item) setDialogue(`Selected ${ITEMS[item].name}: ${ITEMS[item].description}`);
          }}
          onDrinkChai={handleDrinkChai}
          onCombineCards={handleCombineCards}
          onOpenMap={() => {
            markInteraction();
            setActivePuzzle('torn_map_view');
          }}
          onUseHint={handleUseHint}
          onToggleMute={handleToggleMute}
          onPause={() => setScreen('PAUSED')}
        >
          <CartoonScene
            currentRoom={currentRoomDef}
            runConfig={runConfig}
            playerPos={playerPos}
            peerStudent={peerStudent}
            isHiding={isHiding}
            selectedItem={selectedItem}
            collectedFlags={collectedFlags}
            solvedPuzzles={solvedPuzzles}
            powerRestored={powerRestored}
            zombie={zombie}
            particles={particles}
            ghostlySightTimer={ghostlySightTimer}
            onHotspotClick={handleHotspotClick}
            onFloorClick={handleFloorClick}
          />
        </AdventureHud>
      )}

      <PuzzleModal
        puzzleId={activePuzzle}
        currentRoom={roomId}
        runConfig={runConfig}
        powerRestored={powerRestored}
        hasFullCard={inventory.includes('full_access_card')}
        onSolve={handleSolvePuzzle}
        onFail={(msg) => {
          markInteraction();
          adventureSound.playError();
          triggerNoise(14, msg);
        }}
        onClose={() => setActivePuzzle(null)}
      />

      <AdventureModals
        screen={screen}
        showHowToPlay={showHowToPlay}
        currentRoom={currentRoomDef}
        score={score}
        timeRemaining={timeRemaining}
        stickersFound={stickersFound}
        hintsUsed={hintsUsed}
        noiseAlerts={noiseAlerts}
        escapeMethod={escapeMethod}
        gameOverReason={gameOverReason}
        muted={saved.muted}
        onCloseHowToPlay={() => setShowHowToPlay(false)}
        onStartLevelOne={() => {
          adventureSound.playDoorUnlock();
          lastInteractionAtRef.current = Date.now();
          setScreen('PLAYING');
        }}
        onContinueNextRoom={() => {
          adventureSound.playTap();
          lastInteractionAtRef.current = Date.now();
          setDialogue(currentRoomDef.introQuote);
          setScreen('PLAYING');
        }}
        onResume={() => {
          lastInteractionAtRef.current = Date.now();
          setScreen('PLAYING');
        }}
        onRestart={() => resetRun(difficulty, 'PLAYING')}
        onReturnTitle={() => resetRun(difficulty, 'TITLE')}
        onToggleMute={handleToggleMute}
      />
    </main>
  );
}
