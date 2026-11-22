import {
  CampusZone,
  EscapeRouteDefinition,
  EscapeRouteId,
  EscapeRoutePart,
  ExplosiveBarrel,
  HumanNpc,
  InteractiveStation,
  StreetLamp,
  WallObstacle,
} from './types';

export const WORLD_WIDTH = 2400;
export const WORLD_HEIGHT = 1800;

export const CAMPUS_ZONES: CampusZone[] = [
  {
    id: 'quad',
    name: 'Central Quadrangle',
    shortName: 'Quadrangle',
    x: 740,
    y: 560,
    w: 760,
    h: 660,
    floorColor: '#19222d',
    accentColor: '#38bdf8',
    isIndoor: false,
  },
  {
    id: 'academic',
    name: 'Academic Block (CSE & ECE)',
    shortName: 'Academic Block',
    x: 140,
    y: 130,
    w: 700,
    h: 490,
    floorColor: '#1c2432',
    accentColor: '#60a5fa',
    isIndoor: true,
  },
  {
    id: 'science',
    name: 'Physics & Chemistry Wing',
    shortName: 'Science Wing',
    x: 960,
    y: 120,
    w: 480,
    h: 320,
    floorColor: '#1b2630',
    accentColor: '#34d399',
    isIndoor: true,
  },
  {
    id: 'library',
    name: 'Central Library',
    shortName: 'Library',
    x: 1560,
    y: 130,
    w: 700,
    h: 470,
    floorColor: '#242129',
    accentColor: '#fbbf24',
    isIndoor: true,
  },
  {
    id: 'canteen',
    name: 'Student Canteen & Chai Kiosk',
    shortName: 'Canteen',
    x: 140,
    y: 740,
    w: 440,
    h: 340,
    floorColor: '#25211f',
    accentColor: '#fb923c',
    isIndoor: true,
  },
  {
    id: 'sports',
    name: 'Sports Complex & Court',
    shortName: 'Sports Court',
    x: 1620,
    y: 720,
    w: 640,
    h: 400,
    floorColor: '#1d2d27',
    accentColor: '#f97316',
    isIndoor: false,
  },
  {
    id: 'workshop',
    name: 'Mechanical & Maker Lab',
    shortName: 'Maker Lab',
    x: 140,
    y: 1200,
    w: 640,
    h: 460,
    floorColor: '#212229',
    accentColor: '#f59e0b',
    isIndoor: true,
  },
  {
    id: 'admin',
    name: 'Admin Block & Main Gate',
    shortName: 'Main Gate',
    x: 900,
    y: 1320,
    w: 600,
    h: 400,
    floorColor: '#1f252e',
    accentColor: '#22c55e',
    isIndoor: false,
  },
  {
    id: 'hostel',
    name: 'Hostel & Back Drain',
    shortName: 'Hostel Block',
    x: 1620,
    y: 1240,
    w: 640,
    h: 420,
    floorColor: '#1d202b',
    accentColor: '#a78bfa',
    isIndoor: true,
  },
];

export const ESCAPE_ROUTES: Record<EscapeRouteId, EscapeRouteDefinition> = {
  bus: {
    id: 'bus',
    title: 'Main Gate Bus Hotwire',
    shortTitle: 'Campus Bus',
    tagline: 'Collect Bus Keys + 2 Diesel Cans, then hotwire the BMSIT Bus at the Main Gate.',
    victoryTitle: 'Smashed Through the Main Gate!',
    victorySummary:
      'You hotwired the green BMSIT shuttle right under the horde’s nose and barreled out onto Doddaballapur Road.',
    extractionName: 'BMSIT Campus Bus (Main Gate)',
    extractionX: 1200,
    extractionY: 1615,
    accentColor: '#22c55e',
    partIds: ['bus_keys', 'diesel_workshop', 'diesel_shed'],
  },
  chopper: {
    id: 'chopper',
    title: 'Rooftop Chopper Signal',
    shortTitle: 'Chopper Beacon',
    tagline: 'Assemble the 3-part SOS Transponder, trigger the Academic Roof Beacon, and hold out.',
    victoryTitle: 'Airborne from Academic Block!',
    victorySummary:
      'Your cobbled-together transponder pierced the campus interference. The rescue chopper swooped in over the Academic roof.',
    extractionName: 'Academic Roof Helipad Stairs',
    extractionX: 270,
    extractionY: 245,
    accentColor: '#38bdf8',
    partIds: ['transponder_cse', 'antenna_ece', 'battery_physics'],
  },
  tunnel: {
    id: 'tunnel',
    title: 'Secret Metro Drain Tunnel',
    shortTitle: 'Secret Tunnel',
    tagline: 'Grab Crowbar, Campus Blueprint & Warden Keycard, then bypass the Hostel Drain Hatch.',
    victoryTitle: 'Vanished Beneath Campus!',
    victorySummary:
      'With blueprints in hand and the biometric lock bypassed, you pried open the old storm drain and escaped clear to Yelahanka.',
    extractionName: 'Underground Drain Hatch (Hostel)',
    extractionX: 2135,
    extractionY: 1545,
    accentColor: '#a78bfa',
    partIds: ['crowbar_mech', 'blueprint_lib', 'keycard_hostel'],
  },
  glider: {
    id: 'glider',
    title: 'Maker Lab Thruster Glider',
    shortTitle: 'Maker Glider',
    tagline: 'Build a DIY drone-glider from Frame, Parachute & Rocket Fuel and launch off Clocktower!',
    victoryTitle: 'Launched Over the Campus Wall!',
    victorySummary:
      'Pure engineering madness: carbon frame, sports parachute, and chemistry thruster fuel carried you cleanly above the horde.',
    extractionName: 'Clocktower Launch Balcony',
    extractionX: 1200,
    extractionY: 505,
    accentColor: '#f59e0b',
    partIds: ['frame_maker', 'nylon_sports', 'fuel_chem'],
  },
};

export function createInitialParts(): EscapeRoutePart[] {
  return [
    // Route 1: Bus
    {
      id: 'bus_keys',
      routeId: 'bus',
      name: 'Bus Ignition Keys',
      locationHint: 'Admin Office Desk',
      x: 1030,
      y: 1410,
      collected: false,
      color: '#22c55e',
    },
    {
      id: 'diesel_workshop',
      routeId: 'bus',
      name: 'Diesel Jerrycan A',
      locationHint: 'Maker Lab Bay',
      x: 310,
      y: 1525,
      collected: false,
      color: '#22c55e',
    },
    {
      id: 'diesel_shed',
      routeId: 'bus',
      name: 'Diesel Jerrycan B',
      locationHint: 'Admin Generator Corner',
      x: 1415,
      y: 1430,
      collected: false,
      color: '#22c55e',
    },
    // Route 2: Chopper
    {
      id: 'transponder_cse',
      routeId: 'chopper',
      name: 'Server Transponder',
      locationHint: 'CSE Lab (Academic NE)',
      x: 720,
      y: 235,
      collected: false,
      color: '#38bdf8',
    },
    {
      id: 'antenna_ece',
      routeId: 'chopper',
      name: 'High-Gain Antenna',
      locationHint: 'ECE Bench (Academic S)',
      x: 690,
      y: 520,
      collected: false,
      color: '#38bdf8',
    },
    {
      id: 'battery_physics',
      routeId: 'chopper',
      name: 'High-Cap Battery',
      locationHint: 'Physics Lab (Science W)',
      x: 1055,
      y: 235,
      collected: false,
      color: '#38bdf8',
    },
    // Route 3: Tunnel
    {
      id: 'crowbar_mech',
      routeId: 'tunnel',
      name: 'Heavy Crowbar',
      locationHint: 'Mech Workshop Toolrack',
      x: 645,
      y: 1320,
      collected: false,
      color: '#a78bfa',
    },
    {
      id: 'blueprint_lib',
      routeId: 'tunnel',
      name: 'Campus Drain Blueprint',
      locationHint: 'Central Library Archive',
      x: 2135,
      y: 240,
      collected: false,
      color: '#a78bfa',
    },
    {
      id: 'keycard_hostel',
      routeId: 'tunnel',
      name: 'Warden Bypass Keycard',
      locationHint: 'Hostel Warden Desk',
      x: 1750,
      y: 1350,
      collected: false,
      color: '#a78bfa',
    },
    // Route 4: Glider
    {
      id: 'frame_maker',
      routeId: 'glider',
      name: 'Carbon Glider Frame',
      locationHint: 'Maker Lab Prototype Rack',
      x: 260,
      y: 1310,
      collected: false,
      color: '#f59e0b',
    },
    {
      id: 'nylon_sports',
      routeId: 'glider',
      name: 'Parachute Canopy',
      locationHint: 'Sports Court Kit Room',
      x: 2135,
      y: 920,
      collected: false,
      color: '#f59e0b',
    },
    {
      id: 'fuel_chem',
      routeId: 'glider',
      name: 'Rocket Thruster Fuel',
      locationHint: 'Chemistry Lab (Science E)',
      x: 1345,
      y: 240,
      collected: false,
      color: '#f59e0b',
    },
  ];
}

export function createCampusWalls(): WallObstacle[] {
  const walls: WallObstacle[] = [];
  const t = 24;

  // Outer campus perimeter wall with Main Gate gap at bottom center (1110..1290)
  walls.push({ x: 0, y: 0, w: WORLD_WIDTH, h: t, kind: 'fence' });
  walls.push({ x: 0, y: 0, w: t, h: WORLD_HEIGHT, kind: 'fence' });
  walls.push({ x: WORLD_WIDTH - t, y: 0, w: t, h: WORLD_HEIGHT, kind: 'fence' });
  walls.push({ x: 0, y: WORLD_HEIGHT - t, w: 1090, h: t, kind: 'fence' });
  walls.push({ x: 1310, y: WORLD_HEIGHT - t, w: WORLD_WIDTH - 1310, h: t, kind: 'fence' });

  // Central Quadrangle decorative stone fountain (center 1200, 900)
  walls.push({ x: 1140, y: 840, w: 120, h: 120, kind: 'pillar', color: '#334155' });

  // 1. Academic Block (140..840, 130..620) - wide doorways on East & South
  walls.push({ x: 140, y: 130, w: 700, h: 20, kind: 'wall' }); // Top
  walls.push({ x: 140, y: 130, w: 20, h: 490, kind: 'wall' }); // Left
  // East wall with wide door (300..440)
  walls.push({ x: 820, y: 130, w: 20, h: 170, kind: 'wall' });
  walls.push({ x: 820, y: 440, w: 20, h: 180, kind: 'wall' });
  // South wall with wide door (420..560)
  walls.push({ x: 140, y: 600, w: 280, h: 20, kind: 'wall' });
  walls.push({ x: 560, y: 600, w: 280, h: 20, kind: 'wall' });
  // Lab benches & server racks inside Academic Block
  walls.push({ x: 430, y: 230, w: 150, h: 28, kind: 'bench' });
  walls.push({ x: 430, y: 360, w: 150, h: 28, kind: 'bench' });
  walls.push({ x: 250, y: 420, w: 90, h: 36, kind: 'bench' });

  // 2. Science Wing (960..1440, 120..440) - wide South entrance + West/East doors
  walls.push({ x: 960, y: 120, w: 480, h: 20, kind: 'wall' });
  walls.push({ x: 960, y: 120, w: 20, h: 120, kind: 'wall' });
  walls.push({ x: 960, y: 350, w: 20, h: 90, kind: 'wall' });
  walls.push({ x: 1420, y: 120, w: 20, h: 120, kind: 'wall' });
  walls.push({ x: 1420, y: 350, w: 20, h: 90, kind: 'wall' });
  walls.push({ x: 960, y: 420, w: 170, h: 20, kind: 'wall' });
  walls.push({ x: 1270, y: 420, w: 170, h: 20, kind: 'wall' });
  // Center divider + lab benches
  walls.push({ x: 1190, y: 140, w: 20, h: 160, kind: 'wall' });
  walls.push({ x: 1035, y: 310, w: 90, h: 28, kind: 'bench' });
  walls.push({ x: 1275, y: 310, w: 90, h: 28, kind: 'bench' });

  // 3. Central Library (1560..2260, 130..600) - wide West & South doors
  walls.push({ x: 1560, y: 130, w: 700, h: 20, kind: 'wall' });
  walls.push({ x: 2240, y: 130, w: 20, h: 470, kind: 'wall' });
  walls.push({ x: 1560, y: 130, w: 20, h: 170, kind: 'wall' });
  walls.push({ x: 1560, y: 430, w: 20, h: 170, kind: 'wall' });
  walls.push({ x: 1560, y: 580, w: 250, h: 20, kind: 'wall' });
  walls.push({ x: 1940, y: 580, w: 320, h: 20, kind: 'wall' });
  // Bookshelf rows (wide aisles for smooth kiting)
  walls.push({ x: 1720, y: 240, w: 28, h: 190, kind: 'shelf' });
  walls.push({ x: 1890, y: 240, w: 28, h: 190, kind: 'shelf' });
  walls.push({ x: 2060, y: 280, w: 28, h: 170, kind: 'shelf' });

  // 4. Student Canteen (140..580, 740..1080) - open East & South arches
  walls.push({ x: 140, y: 740, w: 440, h: 20, kind: 'wall' });
  walls.push({ x: 140, y: 740, w: 20, h: 340, kind: 'wall' });
  walls.push({ x: 560, y: 740, w: 20, h: 100, kind: 'wall' });
  walls.push({ x: 560, y: 970, w: 20, h: 110, kind: 'wall' });
  walls.push({ x: 140, y: 1060, w: 160, h: 20, kind: 'wall' });
  walls.push({ x: 430, y: 1060, w: 150, h: 20, kind: 'wall' });
  // Canteen tables
  walls.push({ x: 320, y: 830, w: 90, h: 32, kind: 'bench' });
  walls.push({ x: 320, y: 940, w: 90, h: 32, kind: 'bench' });

  // 5. Mechanical & Maker Lab (140..780, 1200..1660)
  walls.push({ x: 140, y: 1200, w: 240, h: 20, kind: 'wall' });
  walls.push({ x: 510, y: 1200, w: 270, h: 20, kind: 'wall' });
  walls.push({ x: 140, y: 1200, w: 20, h: 460, kind: 'wall' });
  walls.push({ x: 140, y: 1640, w: 640, h: 20, kind: 'wall' });
  walls.push({ x: 760, y: 1200, w: 20, h: 160, kind: 'wall' });
  walls.push({ x: 760, y: 1490, w: 20, h: 170, kind: 'wall' });
  // Machinery benches
  walls.push({ x: 340, y: 1360, w: 140, h: 34, kind: 'bench' });
  walls.push({ x: 480, y: 1500, w: 130, h: 34, kind: 'bench' });

  // 6. Admin Office & Campus Bus (900..1500, 1320..1720)
  // Left wing Admin desk room
  walls.push({ x: 920, y: 1320, w: 200, h: 20, kind: 'wall' });
  walls.push({ x: 920, y: 1320, w: 20, h: 180, kind: 'wall' });
  walls.push({ x: 920, y: 1480, w: 110, h: 20, kind: 'wall' });
  // Parked BMSIT Campus Bus hull near Main Gate (player walks up to side/front door)
  walls.push({ x: 1145, y: 1640, w: 110, h: 56, kind: 'bus_hull', color: '#15803d' });

  // 7. Hostel Block (1620..2260, 1240..1660)
  walls.push({ x: 1620, y: 1240, w: 250, h: 20, kind: 'wall' });
  walls.push({ x: 2000, y: 1240, w: 260, h: 20, kind: 'wall' });
  walls.push({ x: 2240, y: 1240, w: 20, h: 420, kind: 'wall' });
  walls.push({ x: 1620, y: 1640, w: 640, h: 20, kind: 'wall' });
  walls.push({ x: 1620, y: 1240, w: 20, h: 150, kind: 'wall' });
  walls.push({ x: 1620, y: 1520, w: 20, h: 140, kind: 'wall' });
  // Hostel wing partition
  walls.push({ x: 1920, y: 1260, w: 20, h: 150, kind: 'wall' });
  walls.push({ x: 1920, y: 1510, w: 20, h: 130, kind: 'wall' });

  return walls;
}

export function createStreetLamps(): StreetLamp[] {
  return [
    { x: 960, y: 740, radius: 220, color: 'rgba(251, 191, 36, 0.24)' },
    { x: 1440, y: 740, radius: 220, color: 'rgba(251, 191, 36, 0.24)' },
    { x: 960, y: 1080, radius: 220, color: 'rgba(251, 191, 36, 0.24)' },
    { x: 1440, y: 1080, radius: 220, color: 'rgba(251, 191, 36, 0.24)' },
    { x: 490, y: 675, radius: 200, color: 'rgba(96, 165, 250, 0.2)' },
    { x: 1200, y: 495, radius: 210, color: 'rgba(245, 158, 11, 0.26)' },
    { x: 1930, y: 920, radius: 280, color: 'rgba(248, 250, 252, 0.2)' },
    { x: 1200, y: 1560, radius: 230, color: 'rgba(34, 197, 94, 0.22)' },
    { x: 480, y: 1140, radius: 200, color: 'rgba(251, 146, 60, 0.22)', flicker: true },
    { x: 1920, y: 650, radius: 210, color: 'rgba(251, 191, 36, 0.2)' },
    { x: 1950, y: 1180, radius: 200, color: 'rgba(167, 139, 250, 0.22)', flicker: true },
  ];
}

export function createInteractiveStations(): InteractiveStation[] {
  return [
    {
      id: 'chai_canteen',
      kind: 'chai',
      label: 'Masala Chai Counter (+40 HP)',
      x: 225,
      y: 890,
      radius: 42,
      cooldown: 0,
      maxCooldown: 24,
      usedOnce: false,
    },
    {
      id: 'coffee_kiosk',
      kind: 'coffee',
      label: 'Cold Coffee Kiosk (Speed & Stamina Boost)',
      x: 500,
      y: 910,
      radius: 42,
      cooldown: 0,
      maxCooldown: 28,
      usedOnce: false,
    },
    {
      id: 'chai_quad',
      kind: 'chai',
      label: 'Quad Vending Machine (+30 HP)',
      x: 825,
      y: 890,
      radius: 38,
      cooldown: 0,
      maxCooldown: 26,
      usedOnce: false,
    },
    {
      id: 'weapon_nailgun',
      kind: 'weapon_crate',
      label: 'Unlock 3D-Printed Nailgun + Ammo',
      x: 510,
      y: 1270,
      radius: 44,
      cooldown: 0,
      maxCooldown: 9999,
      usedOnce: false,
      rewardWeapon: 'nailgun',
    },
    {
      id: 'weapon_tesla',
      kind: 'weapon_crate',
      label: 'Unlock Lab Tesla Coil + Energy',
      x: 525,
      y: 195,
      radius: 44,
      cooldown: 0,
      maxCooldown: 9999,
      usedOnce: false,
      rewardWeapon: 'tesla',
    },
    {
      id: 'alarm_library',
      kind: 'alarm',
      label: 'Pull Library Fire Alarm (Lure Horde)',
      x: 1625,
      y: 365,
      radius: 40,
      cooldown: 0,
      maxCooldown: 30,
      usedOnce: false,
    },
    {
      id: 'alarm_sports',
      kind: 'alarm',
      label: 'Activate Stadium Horn (Lure Horde)',
      x: 1850,
      y: 775,
      radius: 40,
      cooldown: 0,
      maxCooldown: 30,
      usedOnce: false,
    },
    {
      id: 'alarm_workshop',
      kind: 'alarm',
      label: 'Trigger Workshop Siren (Lure Horde)',
      x: 700,
      y: 1580,
      radius: 40,
      cooldown: 0,
      maxCooldown: 30,
      usedOnce: false,
    },
    // Lootable lockers across campus
    {
      id: 'locker_1',
      kind: 'locker',
      label: 'Search CSE Supply Locker',
      x: 220,
      y: 530,
      radius: 38,
      cooldown: 0,
      maxCooldown: 35,
      usedOnce: false,
    },
    {
      id: 'locker_2',
      kind: 'locker',
      label: 'Search Science First-Aid Cabinet',
      x: 1150,
      y: 195,
      radius: 38,
      cooldown: 0,
      maxCooldown: 35,
      usedOnce: false,
    },
    {
      id: 'locker_3',
      kind: 'locker',
      label: 'Search Library Study Desk',
      x: 1815,
      y: 500,
      radius: 38,
      cooldown: 0,
      maxCooldown: 35,
      usedOnce: false,
    },
    {
      id: 'locker_4',
      kind: 'locker',
      label: 'Search Sports Kit Locker',
      x: 1715,
      y: 1055,
      radius: 38,
      cooldown: 0,
      maxCooldown: 35,
      usedOnce: false,
    },
    {
      id: 'locker_5',
      kind: 'locker',
      label: 'Search Hostel Emergency Box',
      x: 2050,
      y: 1320,
      radius: 38,
      cooldown: 0,
      maxCooldown: 35,
      usedOnce: false,
    },
    {
      id: 'locker_6',
      kind: 'locker',
      label: 'Search Guard Booth Drawer',
      x: 1045,
      y: 1625,
      radius: 38,
      cooldown: 0,
      maxCooldown: 35,
      usedOnce: false,
    },
  ];
}

export function createExplosiveBarrels(): ExplosiveBarrel[] {
  const coords = [
    { x: 640, y: 375 }, // Academic corridor
    { x: 1125, y: 365 }, // Science wing
    { x: 1335, y: 365 }, // Chem lab
    { x: 870, y: 690 }, // Quad NW path
    { x: 1525, y: 690 }, // Quad NE path
    { x: 620, y: 920 }, // Outside Canteen
    { x: 1560, y: 920 }, // Outside Sports Court
    { x: 1940, y: 920 }, // Center Basketball Court
    { x: 430, y: 1475 }, // Workshop floor
    { x: 685, y: 1425 }, // Workshop exit
    { x: 1020, y: 1210 }, // Quad South
    { x: 1380, y: 1210 }, // Quad South East
    { x: 1340, y: 1565 }, // Main Gate approach
    { x: 1830, y: 1455 }, // Hostel courtyard
  ];

  return coords.map((pt, i) => ({
    id: `barrel_${i}`,
    x: pt.x,
    y: pt.y,
    radius: 17,
    hp: 30,
    maxHp: 30,
    exploded: false,
    hitFlash: 0,
  }));
}

export function createHumanNpcs(): HumanNpc[] {
  return [
    {
      id: 'npc_diya',
      name: 'Diya',
      role: 'CSE Senior',
      x: 340,
      y: 330,
      vx: 0,
      vy: 0,
      radius: 15,
      angle: 0,
      hp: 100,
      maxHp: 100,
      rescued: false,
      shirtColor: '#ec4899',
      hairColor: '#1e1b18',
      skinColor: '#d9a077',
      speech: 'Help! Trapped in CSE Lab!',
      speechTimer: 5,
      fireCooldown: 0,
      hitFlash: 0,
    },
    {
      id: 'npc_aarav',
      name: 'Aarav',
      role: 'Robotics Club',
      x: 1965,
      y: 350,
      vx: 0,
      vy: 0,
      radius: 15,
      angle: Math.PI,
      hp: 100,
      maxHp: 100,
      rescued: false,
      shirtColor: '#f59e0b',
      hairColor: '#18181b',
      skinColor: '#c68b59',
      speech: 'Over here in the Library!',
      speechTimer: 5,
      fireCooldown: 0,
      hitFlash: 0,
    },
    {
      id: 'npc_rohan',
      name: 'Rohan',
      role: 'Basketball Captain',
      x: 2040,
      y: 890,
      vx: 0,
      vy: 0,
      radius: 15,
      angle: -Math.PI / 2,
      hp: 115,
      maxHp: 115,
      rescued: false,
      shirtColor: '#f97316',
      hairColor: '#27272a',
      skinColor: '#b97a4b',
      speech: 'Need backup at the Court!',
      speechTimer: 5,
      fireCooldown: 0,
      hitFlash: 0,
    },
    {
      id: 'npc_raju',
      name: 'Guard Raju',
      role: 'Campus Security',
      x: 1110,
      y: 1475,
      vx: 0,
      vy: 0,
      radius: 16,
      angle: -Math.PI / 2,
      hp: 130,
      maxHp: 130,
      rescued: false,
      shirtColor: '#3b82f6',
      hairColor: '#52525b',
      skinColor: '#c98e63',
      speech: 'Main Gate is swarming! Team up!',
      speechTimer: 5,
      fireCooldown: 0,
      hitFlash: 0,
    },
    {
      id: 'npc_chai_uncle',
      name: 'Chai Uncle',
      role: 'Canteen',
      x: 225,
      y: 835,
      vx: 0,
      vy: 0,
      radius: 15,
      angle: Math.PI / 2,
      hp: 999,
      maxHp: 999,
      rescued: true,
      isStationaryVendor: true,
      shirtColor: '#10b981',
      hairColor: '#d4d4d8',
      skinColor: '#c68b59',
      speech: 'Hot masala chai ready!',
      speechTimer: 6,
      fireCooldown: 0,
      hitFlash: 0,
    },
  ];
}
