import {
  AdventureDifficulty,
  InventoryItemDef,
  ItemId,
  RoomDefinition,
  RoomId,
  RunConfig,
  SpotlightColor,
} from './adventureTypes';

export const DIFFICULTY_SETTINGS: Record<
  AdventureDifficulty,
  { label: string; seconds: number; noiseMultiplier: number; summary: string }
> = {
  chill: { label: 'Relaxed (15m)', seconds: 15 * 60, noiseMultiplier: 0.55, summary: '15:00 timer · Super gentle' },
  standard: { label: 'Normal (12m)', seconds: 12 * 60, noiseMultiplier: 0.8, summary: '12:00 timer · Smooth & easy' },
  spooky: { label: 'Quick (9m)', seconds: 9 * 60, noiseMultiplier: 1.05, summary: '09:00 timer · Brisk run' },
};

export const BOOK_OPTIONS = [
  { id: 'oldest' as const, label: '1890 Campus Almanac', shortLabel: 'Oldest Almanac', desc: 'Yellowed & Dusty', color: '#a16207' },
  { id: 'blue' as const, label: 'Blue Algorithms Guide', shortLabel: 'Blue Cover', desc: 'Bright Blue Hardcover', color: '#2563eb' },
  { id: 'smallest' as const, label: 'Pocket Mini-Notes', shortLabel: 'Smallest Notes', desc: 'Tiny Cheat-Sheet', color: '#059669' },
  { id: 'heavy' as const, label: 'Giant Calculus Tome', shortLabel: 'Heavy Red Tome', desc: '1,400 Pages · Red', color: '#dc2626' },
];

export const CIRCUIT_OPTIONS = [
  { id: 'power' as const, label: 'Battery Power', shortLabel: 'Power', sub: '5V Maker Supply', color: '#38bdf8' },
  { id: 'servo' as const, label: '3D-Gear Servo', shortLabel: 'Servo', sub: 'Rotor Drive', color: '#22d3ee' },
  { id: 'signal' as const, label: 'RC Antenna', shortLabel: 'Signal', sub: '2.4GHz Buzzer', color: '#34d399' },
];

export const FOOD_OPTIONS = [
  { id: 'dosa' as const, label: 'Masala Dosa', shortLabel: 'Dosa', color: '#f59e0b' },
  { id: 'coffee' as const, label: 'Filter Coffee', shortLabel: 'Coffee', color: '#92400e' },
  { id: 'samosa' as const, label: 'Crispy Samosa', shortLabel: 'Samosa', color: '#ea580c' },
  { id: 'jamun' as const, label: 'Gulab Jamun', shortLabel: 'Jamun', color: '#db2777' },
];

export const SPOTLIGHT_COLORS: Record<SpotlightColor, { label: string; hex: string }> = {
  gold: { label: 'Gold', hex: '#fde047' },
  cyan: { label: 'Cyan', hex: '#38bdf8' },
  rose: { label: 'Pink', hex: '#f472b6' },
};

export const ITEMS: Record<ItemId, InventoryItemDef> = {
  torch: {
    id: 'torch',
    name: 'Small Torch',
    shortName: 'Torch',
    description: 'Shines light on dark clues, notices, and hidden stickers.',
    color: '#fbbf24',
  },
  folded_note: {
    id: 'folded_note',
    name: 'Folded Note',
    shortName: 'Note',
    description: 'Contains your randomized Classroom Desk lock clue.',
    color: '#fde68a',
  },
  classroom_key: {
    id: 'classroom_key',
    name: 'Classroom Key',
    shortName: 'Room Key',
    description: 'Unlocks the Corridor Door to the Central Library.',
    color: '#34d399',
  },
  fuse: {
    id: 'fuse',
    name: 'Power Fuse',
    shortName: 'Fuse',
    description: 'Restores power to the Main Gate Control Panel.',
    color: '#38bdf8',
  },
  torn_map: {
    id: 'torn_map',
    name: 'Torn Campus Map',
    shortName: 'Map',
    description: 'View all 6 campus stages and track where to go next.',
    color: '#fb923c',
  },
  card_frag_a: {
    id: 'card_frag_a',
    name: 'Access-Card Fragment A',
    shortName: 'Card Frag A',
    description: 'First half of the Main Gate RFID card. Auto-combines with Fragment B!',
    color: '#a78bfa',
  },
  plastic_gear: {
    id: 'plastic_gear',
    name: '3D-Printed Gear',
    shortName: '3D Gear',
    description: 'Fits right into the Broken Drone Workbench in the Robotics Lab.',
    color: '#22d3ee',
  },
  mini_drone: {
    id: 'mini_drone',
    name: 'Mini Distraction Drone',
    shortName: 'Mini Drone',
    description: 'Click the Security Desk at the Gate to send the Guard checking on it!',
    color: '#38bdf8',
  },
  plastic_tray: {
    id: 'plastic_tray',
    name: 'Canteen Plastic Tray',
    shortName: 'Tray',
    description: 'Click the Kitchen Door to distract the Canteen Chef with a clatter!',
    color: '#f472b6',
  },
  chai_flask: {
    id: 'chai_flask',
    name: 'Hot Masala Chai Flask',
    shortName: 'Chai (-Noise)',
    description: 'Click anytime to sip & calm your nerves (-35% Noise)!',
    color: '#34d399',
  },
  card_frag_b: {
    id: 'card_frag_b',
    name: 'Access-Card Fragment B',
    shortName: 'Card Frag B',
    description: 'Second half of the Main Gate RFID card.',
    color: '#a78bfa',
  },
  grappling_rope: {
    id: 'grappling_rope',
    name: 'Stage Grappling Rope',
    shortName: 'Rope',
    description: 'Alternate Escape! Click the Watchtower Wall at Stage 6 to climb out!',
    color: '#f59e0b',
  },
  security_keyring: {
    id: 'security_keyring',
    name: 'Backstage Keyring',
    shortName: 'Stage Keys',
    description: 'Unlocks the Main Gate Corridor doors.',
    color: '#eab308',
  },
  full_access_card: {
    id: 'full_access_card',
    name: 'Full Gate Access Card',
    shortName: 'Gate Card',
    description: 'Ready! Swipe at the Main Gate Control Panel with the PIN.',
    color: '#10b981',
  },
};

function shuffle<T>(arr: readonly T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function pickRandom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

const STICKER_CANDIDATES: Record<RoomId, { x: number; y: number }[]> = {
  classroom: [
    { x: 46, y: 24 },
    { x: 64, y: 20 },
    { x: 24, y: 74 },
  ],
  library: [
    { x: 70, y: 22 },
    { x: 36, y: 20 },
    { x: 62, y: 74 },
  ],
  robotics: [
    { x: 68, y: 20 },
    { x: 18, y: 68 },
    { x: 44, y: 72 },
  ],
  canteen: [
    { x: 52, y: 18 },
    { x: 16, y: 74 },
    { x: 65, y: 66 },
  ],
  auditorium: [
    { x: 72, y: 20 },
    { x: 22, y: 68 },
    { x: 40, y: 38 },
  ],
  gate: [
    { x: 34, y: 76 },
    { x: 18, y: 68 },
    { x: 74, y: 68 },
  ],
};

export function generateRunConfig(): RunConfig {
  const digits = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, 3) as [number, number, number];
  const classroomCode = `${digits[0]}${digits[1]}${digits[2]}`;

  const libraryOrder = shuffle(BOOK_OPTIONS.map((b) => b.id)).slice(0, 3);
  const circuitOrder = shuffle(CIRCUIT_OPTIONS.map((c) => c.id));
  const canteenOrder = shuffle(FOOD_OPTIONS.map((f) => f.id)).slice(0, 3);

  const colorKeys: SpotlightColor[] = ['gold', 'cyan', 'rose'];
  let auditoriumColors: [SpotlightColor, SpotlightColor, SpotlightColor] = [
    pickRandom(colorKeys),
    pickRandom(colorKeys),
    pickRandom(colorKeys),
  ];
  // Avoid all-gold starting color so player clicks at least once or twice
  if (
    auditoriumColors[0] === 'gold' &&
    auditoriumColors[1] === 'gold' &&
    auditoriumColors[2] === 'gold'
  ) {
    auditoriumColors = ['cyan', 'rose', 'gold'];
  }

  const gateDigits = shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, 4);
  if (gateDigits[0] === 0) gateDigits[0] = 9;
  const gateCode = gateDigits.join('');

  return {
    classroomClues: digits,
    classroomCode,
    libraryOrder,
    circuitOrder,
    canteenOrder,
    auditoriumColors,
    gateCode,
    stickerSpots: {
      classroom: pickRandom(STICKER_CANDIDATES.classroom),
      library: pickRandom(STICKER_CANDIDATES.library),
      robotics: pickRandom(STICKER_CANDIDATES.robotics),
      canteen: pickRandom(STICKER_CANDIDATES.canteen),
      auditorium: pickRandom(STICKER_CANDIDATES.auditorium),
      gate: pickRandom(STICKER_CANDIDATES.gate),
    },
  };
}

export function getBookLabel(id: string): string {
  return BOOK_OPTIONS.find((b) => b.id === id)?.shortLabel ?? id;
}

export function getCircuitLabel(id: string): string {
  return CIRCUIT_OPTIONS.find((c) => c.id === id)?.shortLabel ?? id;
}

export function getFoodLabel(id: string): string {
  return FOOD_OPTIONS.find((f) => f.id === id)?.shortLabel ?? id;
}

export function getRoomsForConfig(config: RunConfig): Record<RoomId, RoomDefinition> {
  const [c1, c2, c3] = config.classroomClues;
  const libText = config.libraryOrder.map(getBookLabel).join(' → ');
  const circText = config.circuitOrder.map(getCircuitLabel).join(' → ');
  const foodText = config.canteenOrder.map(getFoodLabel).join(' → ');
  const lightText = config.auditoriumColors.map((c) => SPOTLIGHT_COLORS[c].label).join(' · ');

  return {
    classroom: {
      id: 'classroom',
      levelLabel: 'Stage 1 of 6',
      title: 'Classroom Block',
      objective: 'Read the blackboard numbers, open the Teacher Desk drawer, and unlock the door.',
      introQuote: 'Power tripped after midnight! Check the room to find the key out.',
      bgGradient: ['#162044', '#1d2b57'],
      zombieName: 'Zombie Proctor',
      zombieRole: 'student',
      zombiePatrolX: [68, 72],
      zombieY: 66,
      hotspots: [
        { id: 'blackboard', label: 'Blackboard', x: 18, y: 21, w: 30, h: 24, kind: 'inspect' },
        { id: 'wall_clock', label: 'Wall Clock', x: 54, y: 15, w: 10, h: 16, kind: 'inspect' },
        { id: 'school_bag', label: 'School Bag', x: 14, y: 63, w: 13, h: 18, kind: 'collect' },
        { id: 'teacher_desk', label: "Teacher's Desk & Drawer", x: 35, y: 54, w: 20, h: 20, kind: 'puzzle' },
        { id: 'cupboard', label: 'Cupboard (Hide)', x: 6, y: 36, w: 10, h: 32, kind: 'hide' },
        { id: 'loose_books', label: 'Scattered Books', x: 60, y: 74, w: 14, h: 14, kind: 'hazard' },
        {
          id: 'classroom_sticker',
          label: 'Hidden Sticker',
          x: config.stickerSpots.classroom.x,
          y: config.stickerSpots.classroom.y,
          w: 7,
          h: 9,
          kind: 'sticker',
          darkHidden: true,
        },
        { id: 'corridor_door', label: 'Corridor Door', x: 84, y: 31, w: 12, h: 36, kind: 'door' },
      ],
      hints: [
        'Click the School Bag first to pick up your Small Torch and Folded Note.',
        `The Blackboard code for this run is ${c1}-${c2}-${c3} (${config.classroomCode}).`,
        `Click Teacher's Desk, enter ${config.classroomCode} for the Room Key, then click the Corridor Door!`,
      ],
    },
    library: {
      id: 'library',
      levelLabel: 'Stage 2 of 6',
      title: 'Central Library',
      objective: 'Pick the 3 marked books in order, open the Archive Cabinet, and grab Fuse + Card A.',
      introQuote: 'The Night Librarian is half-asleep at her station. Keep voices low!',
      bgGradient: ['#1a193b', '#282356'],
      zombieName: 'Zombie Librarian',
      zombieRole: 'librarian',
      zombiePatrolX: [64, 68],
      zombieY: 69,
      hotspots: [
        { id: 'bookshelves', label: 'Marked Bookshelves', x: 10, y: 20, w: 26, h: 34, kind: 'puzzle' },
        { id: 'reading_table', label: 'Reading Table', x: 38, y: 62, w: 22, h: 18, kind: 'collect' },
        { id: 'librarian_desk', label: 'Librarian Desk', x: 64, y: 48, w: 18, h: 18, kind: 'inspect', darkHidden: true },
        { id: 'archive_cabinet', label: 'Archive Cabinet', x: 44, y: 22, w: 18, h: 28, kind: 'collect' },
        { id: 'study_booth', label: 'Study Booth (Hide)', x: 8, y: 64, w: 14, h: 24, kind: 'hide' },
        {
          id: 'library_sticker',
          label: 'Hidden Sticker',
          x: config.stickerSpots.library.x,
          y: config.stickerSpots.library.y,
          w: 7,
          h: 10,
          kind: 'sticker',
          darkHidden: true,
        },
        { id: 'robotics_door', label: 'Robotics Lab Door', x: 84, y: 31, w: 12, h: 36, kind: 'door' },
      ],
      hints: [
        'Click Reading Table to pick up the Torn Campus Map and check the book order.',
        `Today's Marked Book order is: ${libText}.`,
        'Once solved, click Archive Cabinet for Fuse + Card Frag A, then step into Robotics Lab!',
      ],
    },
    robotics: {
      id: 'robotics',
      levelLabel: 'Stage 3 of 6',
      title: 'Robotics & Maker Lab',
      objective: 'Grab the 3D-Printed Gear, wire the Drone Workbench, and build your Mini Drone.',
      introQuote: 'The Lab-Tech is glued to his soldering station—perfect time to build a drone!',
      bgGradient: ['#112536', '#17344a'],
      zombieName: 'Zombie Lab-Tech',
      zombieRole: 'labtech',
      zombiePatrolX: [66, 70],
      zombieY: 67,
      hotspots: [
        { id: 'printer_3d', label: '3D Printer Station', x: 14, y: 22, w: 22, h: 26, kind: 'collect' },
        { id: 'blueprint_wall', label: 'Drone Blueprint', x: 42, y: 15, w: 22, h: 18, kind: 'inspect' },
        { id: 'drone_crate', label: 'Drone Workbench', x: 45, y: 46, w: 22, h: 20, kind: 'puzzle' },
        { id: 'tool_locker', label: 'Tool Locker (Hide)', x: 5, y: 36, w: 10, h: 32, kind: 'hide' },
        { id: 'sparking_cable', label: 'Loose Extension Cord', x: 30, y: 74, w: 15, h: 12, kind: 'hazard' },
        {
          id: 'robotics_sticker',
          label: 'Hidden Sticker',
          x: config.stickerSpots.robotics.x,
          y: config.stickerSpots.robotics.y,
          w: 7,
          h: 10,
          kind: 'sticker',
          darkHidden: true,
        },
        { id: 'canteen_door', label: 'Canteen Passage', x: 85, y: 31, w: 11, h: 36, kind: 'door' },
      ],
      hints: [
        'Click the 3D Printer Station to grab your 3D-Printed Gear.',
        `Click the Drone Workbench and wire the pins in Blueprint order: ${circText}.`,
        'Building the Mini Drone powers down the exit laser—head right into the Canteen!',
      ],
    },
    canteen: {
      id: 'canteen',
      levelLabel: 'Stage 4 of 6',
      title: 'Midnight Canteen',
      objective: 'Grab the Tray & Chai, distract the Chef at Kitchen Door, and open the Kitchen Locker.',
      introQuote: 'Hot chai is brewing on the counter, and the Chef is waiting by the kitchen.',
      bgGradient: ['#261b30', '#38243e'],
      zombieName: 'Zombie Chef',
      zombieRole: 'chef',
      zombiePatrolX: [48, 52],
      zombieY: 64,
      hotspots: [
        { id: 'menu_board', label: 'Menu Board', x: 14, y: 16, w: 26, h: 22, kind: 'inspect' },
        { id: 'tray_stack', label: 'Tray & Chai Counter', x: 45, y: 44, w: 22, h: 18, kind: 'collect' },
        { id: 'kitchen_hatch', label: 'Kitchen Locker', x: 18, y: 46, w: 18, h: 22, kind: 'puzzle' },
        { id: 'kitchen_decoy_spot', label: 'Kitchen Door (Lure Chef)', x: 71, y: 24, w: 12, h: 28, kind: 'inspect' },
        { id: 'canteen_fridge', label: 'Nescafe Fridge (Hide)', x: 4, y: 36, w: 10, h: 34, kind: 'hide' },
        { id: 'spilled_juice', label: 'Spilled Mango Juice', x: 34, y: 74, w: 16, h: 12, kind: 'hazard' },
        {
          id: 'canteen_sticker',
          label: 'Hidden Sticker',
          x: config.stickerSpots.canteen.x,
          y: config.stickerSpots.canteen.y,
          w: 7,
          h: 10,
          kind: 'sticker',
          darkHidden: true,
        },
        { id: 'auditorium_door', label: 'Auditorium Backstage', x: 86, y: 32, w: 11, h: 36, kind: 'door' },
      ],
      hints: [
        'Grab the Plastic Tray & Hot Chai Flask from the Serving Counter.',
        'Click the Kitchen Door to clatter your Tray and distract the Night Chef.',
        `Click Kitchen Locker and tap today's 3-item Menu Combo: ${foodText}.`,
      ],
    },
    auditorium: {
      id: 'auditorium',
      levelLabel: 'Stage 5 of 6',
      title: 'Auditorium Backstage',
      objective: 'Match the 3 Stage Spotlight colors from the Fest Poster and grab Rope + Stage Keys.',
      introQuote: 'The Sound Crew DJ is wearing noise-canceling headphones at his booth.',
      bgGradient: ['#231538', '#331c4f'],
      zombieName: 'Zombie DJ',
      zombieRole: 'dj',
      zombiePatrolX: [64, 68],
      zombieY: 66,
      hotspots: [
        { id: 'spotlight_console', label: 'Spotlight Console', x: 16, y: 24, w: 22, h: 24, kind: 'puzzle' },
        { id: 'prop_trunk', label: 'Drama Prop Trunk', x: 44, y: 45, w: 22, h: 18, kind: 'collect' },
        { id: 'stage_poster', label: 'Fest Poster Clue', x: 44, y: 16, w: 20, h: 18, kind: 'inspect' },
        { id: 'velvet_curtain', label: 'Velvet Curtain (Hide)', x: 4, y: 30, w: 11, h: 42, kind: 'hide' },
        { id: 'mic_cables', label: 'Tangled Mic Cables', x: 56, y: 74, w: 16, h: 12, kind: 'hazard' },
        {
          id: 'auditorium_sticker',
          label: 'Hidden Sticker',
          x: config.stickerSpots.auditorium.x,
          y: config.stickerSpots.auditorium.y,
          w: 7,
          h: 10,
          kind: 'sticker',
          darkHidden: true,
        },
        { id: 'gate_corridor_door', label: 'Main Gate Corridor', x: 85, y: 31, w: 12, h: 36, kind: 'door' },
      ],
      hints: [
        `Check the Fest Poster color lineup: ${lightText}.`,
        'Click Spotlight Console and set each beam to match the poster colors!',
        'Open the Drama Prop Trunk for Grappling Rope & Stage Keys, then head to the Main Gate!',
      ],
    },
    gate: {
      id: 'gate',
      levelLabel: 'Final Stage (6 of 6)',
      title: 'Main Corridor & Gate',
      objective: 'Use Fuse + Noticeboard PIN at the Gate Panel, OR climb out with Grappling Rope!',
      introQuote: 'Fresh night air! Just one final lock—or the Watchtower Hook—stands in your way.',
      bgGradient: ['#101e33', '#162c46'],
      zombieName: 'Zombie Guard',
      zombieRole: 'gatekeeper',
      zombiePatrolX: [66, 70],
      zombieY: 68,
      hotspots: [
        { id: 'noticeboard', label: 'Security Noticeboard', x: 14, y: 21, w: 22, h: 24, kind: 'inspect' },
        { id: 'fuse_box', label: 'Power Fuse Box', x: 40, y: 22, w: 12, h: 20, kind: 'inspect' },
        { id: 'security_desk', label: 'Security Desk (Mini Drone)', x: 48, y: 52, w: 18, h: 16, kind: 'inspect' },
        { id: 'watchtower_hook', label: 'Watchtower Wall (Rope Exit)', x: 58, y: 14, w: 14, h: 18, kind: 'door' },
        { id: 'safe_alcove', label: 'Emergency Alcove (Hide)', x: 5, y: 40, w: 10, h: 32, kind: 'hide' },
        {
          id: 'gate_sticker',
          label: 'Hidden Sticker',
          x: config.stickerSpots.gate.x,
          y: config.stickerSpots.gate.y,
          w: 7,
          h: 10,
          kind: 'sticker',
          darkHidden: true,
        },
        { id: 'gate_panel', label: 'Gate Control Panel', x: 70, y: 34, w: 11, h: 18, kind: 'puzzle' },
        { id: 'main_gate', label: 'BMSIT Main Gate', x: 82, y: 20, w: 15, h: 52, kind: 'door' },
      ],
      hints: [
        'Route A (Main Gate): Click Power Fuse Box to restore power, then enter the PIN on Gate Panel.',
        `Today's Noticeboard Gate PIN is ${config.gateCode}.`,
        'Route B (Watchtower Rope): Click Security Desk to send out your Mini Drone, then click Watchtower Wall!',
      ],
    },
  };
}

const ROOM_AMBIENT_LINES: Record<RoomId, string[]> = {
  classroom: [
    '*Groooaaan...* The Zombie Proctor shuffles near the desks—stay on the far side!',
    'A trapped classmate whispers: "Stay away from the zombies—run if they turn!"',
    'Chalk dust drifts in the moonlight while a Zombie groans softly.',
    'The desk clock ticks quietly—grab the key before dawn!',
  ],
  library: [
    '*Shhhhh...* The Zombie Librarian mutters about overdue books.',
    'Another student whispers from the Study Booth: "Keep quiet so the zombie stays calm!"',
    'Pages flutter softly near the tall Archive Cabinet.',
    'Warm reading lamps light the shelves while the Zombie lingers nearby.',
  ],
  robotics: [
    '*Bzzzt...* The Zombie Lab-Tech stares blankly at a smoking circuit.',
    'A classmate near the locker whispers: "Wire the drone and let us get out of here!"',
    'A status LED blinks calmly beside the Drone Workbench.',
    'Freshly printed gear parts sit neatly on the 3D Printer tray.',
  ],
  canteen: [
    '*Sniff sniff...* The Zombie Chef groans hungrily for midnight masala dosa.',
    'A student ducks behind the counter: "Throw a tray to distract the Zombie Chef!"',
    'Fresh cardamom steam drifts from the Masala Chai flask.',
    'Samosa plates clink softly in the quiet canteen.',
  ],
  auditorium: [
    '*Thump-tss...* The Zombie DJ sways near the speakers.',
    'A backstage student whispers: "Light the stage colors to keep him distracted!"',
    'Velvet stage curtains sway lightly in the AC breeze.',
    'Dust sparkles above the stage lighting console.',
  ],
  gate: [
    '*Jingle... jangle...* The Zombie Guard rattles keys near the Main Gate.',
    'A classmate whispers: "Students stay clear—send your drone or climb the rope!"',
    'Streetlamps glow right outside—freedom is meters away!',
    'Cool night breeze blows through the iron bars of the BMSIT Main Gate.',
  ],
};

const NOISY_GROAN_LINES = [
  '*Grrrroooaaan!* The Zombie heard footsteps—students run to the opposite side!',
  'Zombie approaching! Click away, use a hiding spot, or sip Chai to lower Noise!',
  '*Uuuughhh...* Too loud! Keep your distance from the Zombie!',
];

const HIDING_AMBIENT_LINES = [
  'Tucked safely out of sight while the Zombie looks the other way.',
  'Nice and quiet in cover. Your Noise Meter is dropping steadily.',
  'Students stay safe in cover—wait a moment before stepping back out.',
];

export function getSpookyAmbientLine(
  roomId: RoomId,
  noiseLevel: number,
  isHiding: boolean
): string {
  if (isHiding) {
    return HIDING_AMBIENT_LINES[Math.floor(Math.random() * HIDING_AMBIENT_LINES.length)];
  }
  if (noiseLevel >= 55 && Math.random() < 0.6) {
    return NOISY_GROAN_LINES[Math.floor(Math.random() * NOISY_GROAN_LINES.length)];
  }
  const pool = ROOM_AMBIENT_LINES[roomId];
  return pool[Math.floor(Math.random() * pool.length)];
}

export function getPlayerRank(score: number): { title: string; line: string } {
  if (score >= 950) {
    return {
      title: 'Campus Legend',
      line: 'Outsmarted every stage effortlessly and beat the morning bell!',
    };
  }
  if (score >= 650) {
    return {
      title: 'Night Owl',
      line: 'Cool under pressure—from the Robotics Lab right out the Main Gate!',
    };
  }
  if (score >= 350) {
    return {
      title: 'Clever Escapee',
      line: 'Slipped past the late-night campus staff with chai still warm!',
    };
  }
  return {
    title: 'Midnight Survivor',
    line: 'Made a few loud footsteps along the way, but walked out smiling!',
  };
}
