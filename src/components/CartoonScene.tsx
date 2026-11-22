import React from 'react';
import {
  getCircuitLabel,
  getFoodLabel,
  ITEMS,
  SPOTLIGHT_COLORS,
} from '../game/adventureData';
import {
  CartoonParticle,
  ItemId,
  PeerStudentRuntime,
  RoomDefinition,
  RoomHotspot,
  RoomZombieRuntime,
  RunConfig,
} from '../game/adventureTypes';

interface CartoonSceneProps {
  currentRoom: RoomDefinition;
  runConfig: RunConfig;
  playerPos: { x: number; y: number };
  peerStudent: PeerStudentRuntime;
  isHiding: boolean;
  selectedItem: ItemId | null;
  collectedFlags: Record<string, boolean>;
  solvedPuzzles: Record<string, boolean>;
  powerRestored: boolean;
  zombie: RoomZombieRuntime;
  particles: CartoonParticle[];
  ghostlySightTimer: number;
  onHotspotClick: (hotspot: RoomHotspot) => void;
  onFloorClick: (xPercent: number) => void;
}

export const CartoonScene: React.FC<CartoonSceneProps> = ({
  currentRoom,
  runConfig,
  playerPos,
  peerStudent,
  isHiding,
  selectedItem,
  collectedFlags,
  solvedPuzzles,
  powerRestored,
  zombie,
  particles,
  ghostlySightTimer,
  onHotspotClick,
  onFloorClick,
}) => {
  const room = currentRoom;
  const roomId = room.id;
  const torchOn = selectedItem === 'torch';
  const ghostlyActive = ghostlySightTimer > 0;

  const renderZombiePerson = () => {
    const zx = zombie.x * 10;
    const zy = zombie.y * 5.6;
    const facingLeft = playerPos.x < zombie.x || zombie.patrolDir < 0;

    const paletteByRole = {
      student: { jacket: '#374151', shirt: '#94a3b8', pants: '#1f2937', skin: '#98b091', hair: '#1e293b' },
      librarian: { jacket: '#4c1d95', shirt: '#cbd5e1', pants: '#1e1b4b', skin: '#9eb399', hair: '#3b1f0e' },
      labtech: { jacket: '#cbd5e1', shirt: '#0369a1', pants: '#334155', skin: '#98b091', hair: '#0f172a' },
      chef: { jacket: '#e2e8f0', shirt: '#991b1b', pants: '#1f2937', skin: '#9ab094', hair: '#18181b' },
      dj: { jacket: '#3b0764', shirt: '#be123c', pants: '#0f172a', skin: '#97af90', hair: '#09090b' },
      gatekeeper: { jacket: '#172554', shirt: '#93c5fd', pants: '#0f172a', skin: '#98b091', hair: '#334155' },
    }[room.zombieRole];

    return (
      <g transform={`translate(${zx}, ${zy})`} className="pointer-events-none">
        {/* Ground Shadow */}
        <ellipse cx="0" cy="72" rx="26" ry="7" fill="rgba(0,0,0,0.45)" />

        <g transform={facingLeft ? 'scale(-1, 1)' : undefined}>
          {/* Worn Shoes */}
          <rect x="-15" y="62" width="12" height="8" rx="3" fill="#09090b" />
          <rect x="3" y="62" width="12" height="8" rx="3" fill="#09090b" />

          {/* Ripped Trousers */}
          <rect x="-14" y="24" width="11" height="40" rx="3" fill={paletteByRole.pants} stroke="#0f172a" strokeWidth="1.5" />
          <rect x="3" y="24" width="11" height="40" rx="3" fill={paletteByRole.pants} stroke="#0f172a" strokeWidth="1.5" />
          <polygon points="-13,44 -5,44 -9,49" fill={paletteByRole.skin} />

          {/* Tattered Shoulders & Torso */}
          <path
            d="M-21 -14 Q0 -21 21 -14 L17 26 L9 21 L1 27 L-7 22 L-17 26 Z"
            fill={paletteByRole.jacket}
            stroke="#0f172a"
            strokeWidth="2"
          />
          <polygon points="-7,-17 7,-17 0,-3" fill={paletteByRole.shirt} />

          {/* Chef Torn Apron */}
          {room.zombieRole === 'chef' && (
            <path d="M-11 -2 L11 -2 L10 30 L2 25 L-4 31 L-11 26 Z" fill="#b91c1c" opacity="0.9" />
          )}
          {/* Guard Belt & Keys */}
          {room.zombieRole === 'gatekeeper' && (
            <>
              <rect x="-17" y="18" width="34" height="5" fill="#0f172a" />
              <circle cx="9" cy="-4" r="3.5" fill="#facc15" />
            </>
          )}

          {/* Back Arm & Outstretched Reaching Zombie Arm */}
          <path d="M-21 -12 L-25 18 L-18 19 L-15 -6 Z" fill={paletteByRole.jacket} stroke="#0f172a" strokeWidth="1.5" />
          <circle cx="-21.5" cy="21" r="4" fill={paletteByRole.skin} />
          <path d="M18 -11 L40 -5 L39 3 L16 0 Z" fill={paletteByRole.jacket} stroke="#0f172a" strokeWidth="1.5" />
          <circle cx="42" cy="-1" r="4.2" fill={paletteByRole.skin} stroke="#0f172a" strokeWidth="1.2" />

          {/* Neck */}
          <rect x="-5" y="-23" width="10" height="8" fill={paletteByRole.skin} />

          {/* Realistic Zombie Human Head */}
          <ellipse cx="0" cy="-35" rx="13" ry="15" fill={paletteByRole.skin} stroke="#0f172a" strokeWidth="1.8" />

          {/* Messy Hair / Headgear */}
          {room.zombieRole === 'chef' ? (
            <path d="M-13 -44 C-16 -62 16 -62 13 -44 Z" fill="#e2e8f0" stroke="#0f172a" strokeWidth="1.8" />
          ) : room.zombieRole === 'gatekeeper' ? (
            <>
              <path d="M-14 -44 L14 -44 L11 -56 L-11 -56 Z" fill="#172554" stroke="#0f172a" strokeWidth="1.8" />
              <rect x="-15" y="-44" width="30" height="4" rx="2" fill="#0f172a" />
            </>
          ) : (
            <path
              d="M-14 -37 Q-10 -54 1 -52 Q13 -52 14 -36 Q7 -44 0 -41 Q-7 -45 -14 -37 Z"
              fill={paletteByRole.hair}
            />
          )}

          {/* Hollow Dark Eye Circles & Eerie Pupils */}
          <circle cx="-5.5" cy="-36" r="3.8" fill="#334155" opacity="0.65" />
          <circle cx="5.5" cy="-36" r="3.8" fill="#334155" opacity="0.65" />
          <circle cx="-5.5" cy="-36" r="1.6" fill="#fef08a" />
          <circle cx="5.5" cy="-36" r="1.6" fill="#fef08a" />
          <path d="M-6 -26 L-2 -28 L2 -25 L6 -27" fill="none" stroke="#1e293b" strokeWidth="1.6" strokeLinecap="round" />

          {/* Librarian Glasses */}
          {room.zombieRole === 'librarian' && (
            <>
              <rect x="-10" y="-39" width="8" height="6" rx="2" fill="none" stroke="#fde047" strokeWidth="1.5" />
              <rect x="2" y="-39" width="8" height="6" rx="2" fill="none" stroke="#fde047" strokeWidth="1.5" />
              <line x1="-2" y1="-36" x2="2" y2="-36" stroke="#fde047" strokeWidth="1.5" />
            </>
          )}

          {/* Lab-Tech Safety Glasses */}
          {room.zombieRole === 'labtech' && (
            <rect x="-11" y="-40" width="22" height="8" rx="3" fill="rgba(56, 189, 248, 0.35)" stroke="#0f172a" strokeWidth="1.4" />
          )}

          {/* DJ Headphones */}
          {room.zombieRole === 'dj' && (
            <>
              <path d="M-14 -36 A14 14 0 0 1 14 -36" fill="none" stroke="#f43f5e" strokeWidth="3" />
              <rect x="-17" y="-41" width="5" height="10" rx="2" fill="#f43f5e" />
              <rect x="12" y="-41" width="5" height="10" rx="2" fill="#f43f5e" />
            </>
          )}
        </g>

        {/* Alert Badge */}
        {(zombie.state === 'alert' || zombie.state === 'approach') && (
          <g transform="translate(0, -76)">
            <circle cx="0" cy="0" r="13" fill="#ef4444" stroke="#ffffff" strokeWidth="2" />
            <text x="0" y="5" textAnchor="middle" fill="#ffffff" fontWeight="800" fontSize="15">
              !
            </text>
          </g>
        )}

        {zombie.bubble && (
          <g transform="translate(0, -82)">
            <rect
              x="-76"
              y="-18"
              width="152"
              height="26"
              rx="8"
              fill="#fef2f2"
              stroke="#991b1b"
              strokeWidth="2"
            />
            <text
              x="0"
              y="-1"
              textAnchor="middle"
              fill="#7f1d1d"
              fontWeight="700"
              fontSize="11"
              fontFamily="'Plus Jakarta Sans', sans-serif"
            >
              {zombie.bubble}
            </text>
          </g>
        )}

        <rect x="-66" y="75" width="132" height="19" rx="6" fill="rgba(127, 29, 29, 0.88)" stroke="#fca5a5" strokeWidth="1" />
        <text
          x="0"
          y="88"
          textAnchor="middle"
          fill="#fecaca"
          fontSize="10"
          fontWeight="800"
          fontFamily="'Plus Jakarta Sans', sans-serif"
        >
          ZOMBIE · {room.zombieName.replace('Zombie ', '')}
        </text>
      </g>
    );
  };

  const renderPeerStudent = () => {
    const sx = peerStudent.x * 10;
    const sy = peerStudent.y * 5.6;
    const runningLeft = peerStudent.x < zombie.x;

    return (
      <g transform={`translate(${sx}, ${sy})`} className="pointer-events-none">
        <ellipse cx="0" cy="68" rx="20" ry="5.5" fill="rgba(0,0,0,0.38)" />

        <g transform={runningLeft ? 'scale(-1, 1)' : undefined}>
          {/* Sneakers */}
          <rect x="-12" y="59" width="10" height="7" rx="3" fill="#f8fafc" stroke="#0f172a" strokeWidth="1.5" />
          <rect x="2" y="59" width="10" height="7" rx="3" fill="#f8fafc" stroke="#0f172a" strokeWidth="1.5" />

          {/* Clean Denim Jeans */}
          <rect x="-11" y="23" width="9" height="38" rx="3" fill="#334155" stroke="#0f172a" strokeWidth="1.5" />
          <rect x="2" y="23" width="9" height="38" rx="3" fill="#334155" stroke="#0f172a" strokeWidth="1.5" />

          {/* Campus Backpack */}
          <rect x="-20" y="-8" width="8" height="28" rx="4" fill="#059669" stroke="#0f172a" strokeWidth="1.4" />

          {/* Bright Amber Student Varsity Hoodie */}
          <path d="M-16 -13 Q0 -18 16 -13 L14 25 L-14 25 Z" fill="#f59e0b" stroke="#0f172a" strokeWidth="2" />
          {/* BMSIT ID Card Lanyard */}
          <line x1="-5" y1="-14" x2="0" y2="2" stroke="#ffffff" strokeWidth="1.6" />
          <line x1="5" y1="-14" x2="0" y2="2" stroke="#ffffff" strokeWidth="1.6" />
          <rect x="-4" y="2" width="8" height="10" rx="1.5" fill="#ffffff" stroke="#0f172a" strokeWidth="1" />

          {/* Arms */}
          <path d="M-16 -11 L-20 15 L-14 16 L-11 -5 Z" fill="#f59e0b" stroke="#0f172a" strokeWidth="1.4" />
          <path d="M16 -11 L20 15 L14 16 L11 -5 Z" fill="#f59e0b" stroke="#0f172a" strokeWidth="1.4" />

          {/* Warm Human Head */}
          <rect x="-4" y="-21" width="8" height="7" fill="#d89b6e" />
          <ellipse cx="0" cy="-32" rx="11.5" ry="13" fill="#d89b6e" stroke="#0f172a" strokeWidth="1.8" />
          <path d="M-11.5 -34 Q-9 -48 0 -48 Q9 -48 11.5 -34 Q4 -40 -5 -40 Z" fill="#27272a" />
          <circle cx="-4" cy="-33" r="1.5" fill="#0f172a" />
          <circle cx="4" cy="-33" r="1.5" fill="#0f172a" />
          <circle cx="0" cy="-25" r="2.2" fill="#7c2d12" />
        </g>

        {peerStudent.bubble && (
          <g transform="translate(0, -68)">
            <rect x="-66" y="-17" width="132" height="24" rx="7" fill="#fef3c7" stroke="#d97706" strokeWidth="2" />
            <text
              x="0"
              y="-1"
              textAnchor="middle"
              fill="#78350f"
              fontWeight="800"
              fontSize="10.5"
              fontFamily="'Plus Jakarta Sans', sans-serif"
            >
              {peerStudent.bubble}
            </text>
          </g>
        )}

        <rect x="-48" y="72" width="96" height="17" rx="5" fill="rgba(180, 83, 9, 0.9)" stroke="#fde68a" strokeWidth="1" />
        <text
          x="0"
          y="83.5"
          textAnchor="middle"
          fill="#fef3c7"
          fontSize="9.5"
          fontWeight="800"
          fontFamily="'Plus Jakarta Sans', sans-serif"
        >
          STUDENT
        </text>
      </g>
    );
  };

  const renderRealisticPlayer = () => {
    if (isHiding) {
      return (
        <g
          transform={`translate(${playerPos.x * 10}, ${playerPos.y * 5.6 - 20})`}
          className="pointer-events-none"
        >
          <rect x="-44" y="-14" width="88" height="24" rx="8" fill="#10b981" stroke="#0f172a" strokeWidth="2" />
          <text x="0" y="2" textAnchor="middle" fill="#052e16" fontSize="11.5" fontWeight="800">
            HIDING SAFE
          </text>
        </g>
      );
    }

    const px = playerPos.x * 10;
    const py = playerPos.y * 5.6;

    return (
      <g transform={`translate(${px}, ${py})`} className="pointer-events-none">
        {torchOn && <polygon points="14,-16 210,-90 210,60" fill="rgba(253, 224, 71, 0.2)" />}

        <ellipse cx="0" cy="70" rx="22" ry="6" fill="rgba(0,0,0,0.4)" />

        {/* Sneakers */}
        <rect x="-13" y="61" width="11" height="7" rx="3" fill="#f8fafc" stroke="#0f172a" strokeWidth="1.5" />
        <rect x="2" y="61" width="11" height="7" rx="3" fill="#f8fafc" stroke="#0f172a" strokeWidth="1.5" />

        {/* Blue Jeans */}
        <rect x="-12" y="24" width="10" height="39" rx="3" fill="#1e40af" stroke="#0f172a" strokeWidth="1.5" />
        <rect x="2" y="24" width="10" height="39" rx="3" fill="#1e40af" stroke="#0f172a" strokeWidth="1.5" />

        {/* Student Backpack */}
        <rect x="-22" y="-8" width="9" height="30" rx="4" fill="#0f172a" />

        {/* Bright Clean BMSIT Student Hoodie + Lanyard */}
        <path
          d="M-18 -13 Q0 -19 18 -13 L15 26 L-15 26 Z"
          fill="#0284c7"
          stroke="#0f172a"
          strokeWidth="2"
        />
        <line x1="-5" y1="-14" x2="0" y2="3" stroke="#e0f2fe" strokeWidth="1.6" />
        <line x1="5" y1="-14" x2="0" y2="3" stroke="#e0f2fe" strokeWidth="1.6" />
        <rect x="-4" y="3" width="8" height="10" rx="1.5" fill="#ffffff" stroke="#0f172a" strokeWidth="1" />

        {/* Arms & Hands */}
        <path d="M-18 -11 L-22 17 L-16 18 L-13 -5 Z" fill="#0284c7" stroke="#0f172a" strokeWidth="1.5" />
        <path d="M18 -11 L22 17 L16 18 L13 -5 Z" fill="#0284c7" stroke="#0f172a" strokeWidth="1.5" />
        <circle cx="-19" cy="20" r="3.5" fill="#e2a878" />
        <circle cx="19" cy="20" r="3.5" fill="#e2a878" />

        {/* Warm Healthy Human Head */}
        <rect x="-4.5" y="-22" width="9" height="8" fill="#e2a878" />
        <ellipse cx="0" cy="-34" rx="12" ry="14" fill="#e2a878" stroke="#0f172a" strokeWidth="1.8" />
        <path d="M-12 -36 Q-10 -50 0 -50 Q10 -50 12 -36 Q5 -42 -6 -42 Z" fill="#18181b" />

        {/* Clear Eyes & Expression */}
        <circle cx="-4.5" cy="-34" r="1.5" fill="#0f172a" />
        <circle cx="4.5" cy="-34" r="1.5" fill="#0f172a" />
        <path d="M-3.5 -26 Q0 -24 3.5 -26" fill="none" stroke="#7c2d12" strokeWidth="1.4" strokeLinecap="round" />

        <rect x="-50" y="73" width="100" height="17" rx="5" fill="rgba(3, 105, 161, 0.9)" stroke="#7dd3fc" strokeWidth="1" />
        <text
          x="0"
          y="85"
          textAnchor="middle"
          fill="#e0f2fe"
          fontSize="9.5"
          fontWeight="800"
          fontFamily="'Plus Jakarta Sans', sans-serif"
        >
          YOU (STUDENT)
        </text>
      </g>
    );
  };

  const [c1, c2, c3] = runConfig.classroomClues;
  const posterColors = runConfig.auditoriumColors;

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      <svg
        viewBox="0 0 1000 560"
        preserveAspectRatio="xMidYMid meet"
        className="w-full h-full max-w-[1220px] max-h-[76vh] rounded-2xl border-2 border-slate-700/80 shadow-2xl"
      >
        <defs>
          <linearGradient id={`bg_${roomId}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={room.bgGradient[0]} />
            <stop offset="100%" stopColor={room.bgGradient[1]} />
          </linearGradient>
        </defs>

        {/* Room Wall + Clickable Floor (Click Floor to Run Away from Zombie) */}
        <rect x="0" y="0" width="1000" height="390" fill={`url(#bg_${roomId})`} />
        <rect
          x="0"
          y="390"
          width="1000"
          height="170"
          fill="#101729"
          className="cursor-pointer"
          onClick={(e) => {
            const svg = e.currentTarget.ownerSVGElement;
            if (!svg) return;
            const rect = svg.getBoundingClientRect();
            const relX = ((e.clientX - rect.left) / Math.max(1, rect.width)) * 100;
            onFloorClick(Math.min(88, Math.max(8, relX)));
          }}
        />
        <line x1="0" y1="390" x2="1000" y2="390" stroke="#334155" strokeWidth="4" />

        {/* Moonlight Window */}
        <g opacity="0.55">
          <rect x="70" y="55" width="75" height="90" rx="6" fill="#1e3a5f" stroke="#475569" strokeWidth="4" />
          <circle cx="98" cy="86" r="14" fill="#fef9c3" />
          <line x1="107" y1="55" x2="107" y2="145" stroke="#475569" strokeWidth="3" />
          <line x1="70" y1="100" x2="145" y2="100" stroke="#475569" strokeWidth="3" />
        </g>

        {/* STAGE 1: CLASSROOM PROPS */}
        {roomId === 'classroom' && (
          <g>
            {/* Cupboard hideout */}
            <rect x="58" y="200" width="95" height="190" rx="6" fill="#78350f" stroke="#0f172a" strokeWidth="3" />
            <line x1="105" y1="205" x2="105" y2="385" stroke="#451a03" strokeWidth="3" />
            <text x="105" y="190" textAnchor="middle" fill="#a7f3d0" fontSize="12" fontWeight="700">
              CUPBOARD
            </text>

            {/* Blackboard with Dynamic Clues */}
            <rect x="180" y="110" width="300" height="135" rx="8" fill="#14532d" stroke="#92400e" strokeWidth="8" />
            <text x="330" y="146" textAnchor="middle" fill="#fde68a" fontSize="16" fontWeight="700" fontFamily="'Fredoka', sans-serif">
              MIDNIGHT QUIZ CLUE
            </text>
            <text x="330" y="178" textAnchor="middle" fill="#ecfdf5" fontSize="14" fontWeight="600">
              Attendance = {c1} · Chalks = {c2}
            </text>
            <text x="330" y="204" textAnchor="middle" fill="#ecfdf5" fontSize="14" fontWeight="600">
              Midnight Periods = {c3}
            </text>

            {/* Wall Clock */}
            <circle cx="590" cy="128" r="36" fill="#f8fafc" stroke="#0f172a" strokeWidth="4" />
            <line x1="590" y1="128" x2="590" y2="104" stroke="#0f172a" strokeWidth="3.5" strokeLinecap="round" />
            <line x1="590" y1="128" x2="608" y2="128" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" />

            {/* School Bag */}
            {!collectedFlags.school_bag ? (
              <g transform="translate(150, 355)">
                <rect x="0" y="0" width="58" height="62" rx="14" fill="#ea580c" stroke="#0f172a" strokeWidth="3" />
                <rect x="12" y="26" width="34" height="22" rx="6" fill="#fed7aa" stroke="#0f172a" strokeWidth="2" />
              </g>
            ) : (
              <g transform="translate(150, 355)" opacity="0.5">
                <rect x="0" y="0" width="58" height="62" rx="14" fill="#9a3412" stroke="#0f172a" strokeWidth="3" />
              </g>
            )}

            {/* Teacher Desk & Drawer */}
            <rect x="355" y="300" width="190" height="24" rx="5" fill="#b45309" stroke="#0f172a" strokeWidth="3" />
            <rect x="372" y="324" width="156" height="72" rx="4" fill="#92400e" stroke="#0f172a" strokeWidth="3" />
            <rect
              x="405"
              y="338"
              width="90"
              height="36"
              rx="4"
              fill={solvedPuzzles.classroom_code ? '#10b981' : '#f59e0b'}
              stroke="#0f172a"
              strokeWidth="2.5"
            />
            <text x="450" y="360" textAnchor="middle" fill="#0f172a" fontSize="12" fontWeight="800">
              {solvedPuzzles.classroom_code ? 'OPENED' : 'LOCKED'}
            </text>

            {/* Scattered Books Hazard */}
            <g transform="translate(610, 420)">
              <rect x="0" y="16" width="52" height="16" rx="3" fill="#ef4444" stroke="#0f172a" strokeWidth="2" />
              <rect x="18" y="4" width="52" height="16" rx="3" fill="#3b82f6" stroke="#0f172a" strokeWidth="2" transform="rotate(-10)" />
              <rect x="44" y="22" width="46" height="15" rx="3" fill="#fbbf24" stroke="#0f172a" strokeWidth="2" transform="rotate(8)" />
            </g>

            {/* Corridor Door */}
            <rect
              x="845"
              y="175"
              width="110"
              height="215"
              rx="8"
              fill={solvedPuzzles.classroom_code ? '#059669' : '#475569'}
              stroke="#0f172a"
              strokeWidth="4"
            />
            <circle cx="868" cy="285" r="9" fill="#facc15" stroke="#0f172a" strokeWidth="2" />
            <text x="900" y="162" textAnchor="middle" fill="#fde68a" fontSize="13" fontWeight="800">
              TO LIBRARY
            </text>
          </g>
        )}

        {/* STAGE 2: LIBRARY PROPS */}
        {roomId === 'library' && (
          <g>
            {/* Marked Bookshelves */}
            <rect x="105" y="110" width="245" height="205" rx="8" fill="#582f0e" stroke="#0f172a" strokeWidth="4" />
            <line x1="115" y1="180" x2="340" y2="180" stroke="#3b1f09" strokeWidth="6" />
            <line x1="115" y1="250" x2="340" y2="250" stroke="#3b1f09" strokeWidth="6" />
            <rect x="135" y="130" width="26" height="48" rx="3" fill="#a16207" stroke="#fef08a" strokeWidth="2" />
            <rect x="195" y="130" width="26" height="48" rx="3" fill="#2563eb" stroke="#fef08a" strokeWidth="2" />
            <rect x="260" y="148" width="22" height="30" rx="3" fill="#10b981" stroke="#fef08a" strokeWidth="2" />
            <rect x="305" y="124" width="28" height="54" rx="3" fill="#dc2626" stroke="#fef08a" strokeWidth="2" />
            <text x="228" y="96" textAnchor="middle" fill="#fde68a" fontSize="13" fontWeight="800">
              MARKED BOOKS
            </text>

            {/* Study Booth Hideout */}
            <rect x="85" y="355" width="125" height="130" rx="10" fill="#312e81" stroke="#0f172a" strokeWidth="3" />
            <text x="148" y="344" textAnchor="middle" fill="#a7f3d0" fontSize="12" fontWeight="700">
              STUDY BOOTH
            </text>

            {/* Archive Cabinet */}
            <rect
              x="445"
              y="125"
              width="165"
              height="160"
              rx="8"
              fill={solvedPuzzles.library_books ? '#0f766e' : '#334155'}
              stroke="#0f172a"
              strokeWidth="4"
            />
            <text x="528" y="195" textAnchor="middle" fill="#ffffff" fontSize="14" fontWeight="800">
              ARCHIVE
            </text>
            <text x="528" y="216" textAnchor="middle" fill="#fde68a" fontSize="12" fontWeight="700">
              {collectedFlags.archive_cabinet
                ? 'EMPTY'
                : solvedPuzzles.library_books
                  ? 'OPEN! CLICK!'
                  : 'LOCKED'}
            </text>

            {/* Reading Table */}
            <rect x="385" y="355" width="210" height="70" rx="10" fill="#78350f" stroke="#0f172a" strokeWidth="3" />
            {!collectedFlags.reading_table && (
              <rect x="455" y="370" width="60" height="36" rx="4" fill="#fef3c7" stroke="#0f172a" strokeWidth="2" />
            )}

            {/* Librarian Desk */}
            <rect x="650" y="275" width="165" height="90" rx="8" fill="#4c1d95" stroke="#0f172a" strokeWidth="3" />
            <rect x="705" y="242" width="52" height="38" rx="4" fill={torchOn ? '#38bdf8' : '#1e293b'} stroke="#0f172a" strokeWidth="2" />

            {/* Robotics Lab Door */}
            <rect
              x="845"
              y="175"
              width="110"
              height="215"
              rx="8"
              fill={collectedFlags.archive_cabinet ? '#059669' : '#475569'}
              stroke="#0f172a"
              strokeWidth="4"
            />
            <text x="900" y="162" textAnchor="middle" fill="#fde68a" fontSize="13" fontWeight="800">
              TO ROBOTICS
            </text>
          </g>
        )}

        {/* STAGE 3: ROBOTICS & MAKER LAB PROPS */}
        {roomId === 'robotics' && (
          <g>
            {/* Tool Locker Hideout */}
            <rect x="48" y="200" width="96" height="190" rx="8" fill="#1e293b" stroke="#0ea5e9" strokeWidth="3" />
            <line x1="65" y1="230" x2="128" y2="230" stroke="#38bdf8" strokeWidth="3" />
            <text x="96" y="186" textAnchor="middle" fill="#a7f3d0" fontSize="12" fontWeight="700">
              TOOL LOCKER
            </text>

            {/* 3D Printer Station */}
            <rect x="145" y="130" width="210" height="145" rx="10" fill="#1e293b" stroke="#22d3ee" strokeWidth="4" />
            <rect x="170" y="155" width="160" height="95" rx="6" fill="#0f172a" />
            {!collectedFlags.printer_3d ? (
              <circle cx="250" cy="212" r="22" fill="#22d3ee" stroke="#ffffff" strokeWidth="3" strokeDasharray="7 4" />
            ) : (
              <text x="250" y="210" textAnchor="middle" fill="#64748b" fontSize="12" fontWeight="700">
                GEAR PRINTED
              </text>
            )}
            <text x="250" y="118" textAnchor="middle" fill="#67e8f9" fontSize="13" fontWeight="800">
              3D PRINTER
            </text>

            {/* Dynamic Blueprint Wall */}
            <rect x="405" y="84" width="245" height="95" rx="8" fill="#1e3a8a" stroke="#93c5fd" strokeWidth="4" />
            <text x="528" y="114" textAnchor="middle" fill="#bfdbfe" fontSize="12" fontWeight="800">
              DRONE BLUEPRINT
            </text>
            <text x="528" y="142" textAnchor="middle" fill="#fde047" fontSize="13" fontWeight="700">
              {runConfig.circuitOrder.map((c, idx) => `${idx + 1}.${getCircuitLabel(c)}`).join(' → ')}
            </text>

            {/* Broken Drone Workbench */}
            <rect x="455" y="255" width="215" height="105" rx="10" fill="#334155" stroke="#0f172a" strokeWidth="4" />
            <rect
              x="490"
              y="278"
              width="145"
              height="55"
              rx="8"
              fill={solvedPuzzles.robotics_circuit ? '#059669' : '#1e293b'}
              stroke="#38bdf8"
              strokeWidth="2.5"
            />
            <text x="562" y="310" textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="800">
              {solvedPuzzles.robotics_circuit ? 'DRONE READY!' : 'DRONE WORKBENCH'}
            </text>

            {/* Loose Extension Cord Hazard */}
            <path
              d="M310 432 Q360 415 395 445 Q425 468 455 432"
              fill="none"
              stroke="#facc15"
              strokeWidth="8"
              strokeLinecap="round"
            />
            <circle cx="385" cy="434" r="7" fill="#ef4444" />

            {/* Canteen Passage Door */}
            <rect
              x="850"
              y="175"
              width="110"
              height="215"
              rx="8"
              fill={solvedPuzzles.robotics_circuit ? '#059669' : '#475569'}
              stroke="#0f172a"
              strokeWidth="4"
            />
            <text x="905" y="162" textAnchor="middle" fill="#fde68a" fontSize="13" fontWeight="800">
              TO CANTEEN
            </text>
          </g>
        )}

        {/* STAGE 4: CANTEEN PROPS */}
        {roomId === 'canteen' && (
          <g>
            {/* Nescafe Fridge Hideout */}
            <rect x="42" y="200" width="95" height="190" rx="10" fill="#dc2626" stroke="#0f172a" strokeWidth="4" />
            <rect x="54" y="220" width="71" height="95" rx="6" fill="#bae6fd" stroke="#0f172a" strokeWidth="2" />
            <text x="90" y="188" textAnchor="middle" fill="#a7f3d0" fontSize="12" fontWeight="700">
              FRIDGE
            </text>

            {/* Dynamic Menu Board (3 Items) */}
            <rect x="145" y="95" width="260" height="125" rx="8" fill="#1e293b" stroke="#fbbf24" strokeWidth="5" />
            <text x="275" y="126" textAnchor="middle" fill="#fde047" fontSize="14" fontWeight="800">
              MIDNIGHT SPECIALS
            </text>
            <text x="275" y="164" textAnchor="middle" fill="#f8fafc" fontSize="13" fontWeight="700">
              {runConfig.canteenOrder.map((f, idx) => `${idx + 1}.${getFoodLabel(f)}`).join(' → ')}
            </text>

            {/* Kitchen Compartment */}
            <rect
              x="180"
              y="260"
              width="175"
              height="120"
              rx="8"
              fill={solvedPuzzles.canteen_sequence ? '#059669' : '#7c2d12'}
              stroke="#0f172a"
              strokeWidth="4"
            />
            <text x="268" y="320" textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="800">
              {collectedFlags.canteen_sequence ? 'FRAGMENT B TAKEN' : 'KITCHEN LOCKER'}
            </text>

            {/* Serving Counter, Tray & Chai Flask */}
            <rect x="455" y="255" width="215" height="90" rx="8" fill="#9a3412" stroke="#0f172a" strokeWidth="4" />
            {!collectedFlags.tray_stack && (
              <g>
                <rect x="492" y="268" width="72" height="34" rx="6" fill="#f472b6" stroke="#0f172a" strokeWidth="2.5" />
                <rect x="582" y="262" width="26" height="42" rx="6" fill="#34d399" stroke="#0f172a" strokeWidth="2.5" />
              </g>
            )}

            {/* Kitchen Door (Distraction spot) */}
            <rect x="712" y="135" width="110" height="165" rx="8" fill="#334155" stroke="#0f172a" strokeWidth="4" />
            <text x="767" y="218" textAnchor="middle" fill="#fbcfe8" fontSize="12" fontWeight="800">
              KITCHEN DOOR
            </text>

            {/* Spilled Mango Juice */}
            <ellipse cx="420" cy="445" rx="75" ry="28" fill="#fb923c" stroke="#ea580c" strokeWidth="3" />

            {/* Auditorium Backstage Door */}
            <rect
              x="860"
              y="180"
              width="108"
              height="210"
              rx="8"
              fill={collectedFlags.canteen_sequence ? '#059669' : '#475569'}
              stroke="#0f172a"
              strokeWidth="4"
            />
            <text x="914" y="166" textAnchor="middle" fill="#fde68a" fontSize="13" fontWeight="800">
              TO AUDITORIUM
            </text>
          </g>
        )}

        {/* STAGE 5: AUDITORIUM BACKSTAGE PROPS */}
        {roomId === 'auditorium' && (
          <g>
            {/* Stage Spotlight Beams in Dynamic Colors when Solved */}
            {solvedPuzzles.auditorium_lights && (
              <g opacity="0.26" className="pointer-events-none">
                <polygon points="260,40 160,390 360,390" fill={SPOTLIGHT_COLORS[posterColors[0]].hex} />
                <polygon points="540,40 420,390 660,390" fill={SPOTLIGHT_COLORS[posterColors[1]].hex} />
                <polygon points="730,40 610,390 820,390" fill={SPOTLIGHT_COLORS[posterColors[2]].hex} />
              </g>
            )}

            {/* Velvet Curtain Hideout */}
            <rect x="42" y="168" width="108" height="225" rx="8" fill="#881337" stroke="#0f172a" strokeWidth="4" />
            <line x1="72" y1="175" x2="72" y2="390" stroke="#4c0519" strokeWidth="4" />
            <line x1="115" y1="175" x2="115" y2="390" stroke="#4c0519" strokeWidth="4" />
            <text x="96" y="156" textAnchor="middle" fill="#a7f3d0" fontSize="12" fontWeight="700">
              CURTAIN
            </text>

            {/* Stage Spotlight Console */}
            <rect
              x="165"
              y="140"
              width="210"
              height="128"
              rx="10"
              fill={solvedPuzzles.auditorium_lights ? '#065f46' : '#1e293b'}
              stroke="#fde047"
              strokeWidth="4"
            />
            <circle cx="220" cy="195" r="16" fill={SPOTLIGHT_COLORS[posterColors[0]].hex} />
            <circle cx="270" cy="195" r="16" fill={SPOTLIGHT_COLORS[posterColors[1]].hex} />
            <circle cx="320" cy="195" r="16" fill={SPOTLIGHT_COLORS[posterColors[2]].hex} />
            <text x="270" y="246" textAnchor="middle" fill="#ffffff" fontSize="12.5" fontWeight="800">
              {solvedPuzzles.auditorium_lights ? 'SPOTLIGHTS SET!' : 'LIGHT CONSOLE'}
            </text>

            {/* Dynamic Fest Poster */}
            <rect x="440" y="92" width="205" height="98" rx="8" fill="#4c1d95" stroke="#c084fc" strokeWidth="4" />
            <text x="542" y="126" textAnchor="middle" fill="#fde047" fontSize="13" fontWeight="800">
              UTSAHA FEST POSTER
            </text>
            <text x="542" y="154" textAnchor="middle" fill="#f8fafc" fontSize="13" fontWeight="700">
              {posterColors.map((c) => SPOTLIGHT_COLORS[c].label).join(' · ')}
            </text>

            {/* Drama Prop Trunk */}
            <rect
              x="445"
              y="255"
              width="210"
              height="100"
              rx="10"
              fill={collectedFlags.prop_trunk ? '#334155' : '#b45309'}
              stroke="#0f172a"
              strokeWidth="4"
            />
            <text x="550" y="308" textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="800">
              {collectedFlags.prop_trunk ? 'ROPE & KEYS TAKEN' : 'DRAMA PROP TRUNK'}
            </text>

            {/* Mic Cables Hazard */}
            <path
              d="M565 445 Q615 415 655 448 Q685 470 720 432"
              fill="none"
              stroke="#e11d48"
              strokeWidth="7"
              strokeLinecap="round"
            />

            {/* Main Gate Corridor Door */}
            <rect
              x="850"
              y="175"
              width="112"
              height="215"
              rx="8"
              fill={collectedFlags.prop_trunk ? '#059669' : '#475569'}
              stroke="#0f172a"
              strokeWidth="4"
            />
            <text x="906" y="162" textAnchor="middle" fill="#fde68a" fontSize="13" fontWeight="800">
              TO MAIN GATE
            </text>
          </g>
        )}

        {/* FINAL STAGE 6: MAIN CORRIDOR & GATE */}
        {roomId === 'gate' && (
          <g>
            {/* Emergency Alcove */}
            <rect x="52" y="220" width="95" height="175" rx="10" fill="#1e293b" stroke="#10b981" strokeWidth="3" />
            <text x="100" y="206" textAnchor="middle" fill="#a7f3d0" fontSize="12" fontWeight="700">
              SAFE ALCOVE
            </text>

            {/* Noticeboard with Dynamic PIN */}
            <rect x="148" y="115" width="215" height="135" rx="8" fill="#92400e" stroke="#0f172a" strokeWidth="4" />
            <rect x="164" y="130" width="183" height="105" rx="4" fill="#fef3c7" />
            <text x="255" y="164" textAnchor="middle" fill="#0f172a" fontSize="13" fontWeight="800">
              NIGHT GATE NOTICE
            </text>
            <text x="255" y="196" textAnchor="middle" fill={torchOn ? '#dc2626' : '#334155'} fontSize="18" fontWeight="800">
              GATE PIN: {runConfig.gateCode}
            </text>

            {/* Fuse Box */}
            <rect
              x="400"
              y="128"
              width="115"
              height="108"
              rx="8"
              fill={powerRestored ? '#065f46' : '#475569'}
              stroke="#0f172a"
              strokeWidth="4"
            />
            <circle cx="458" cy="166" r="14" fill={powerRestored ? '#34d399' : '#ef4444'} />
            <text x="458" y="216" textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="800">
              {powerRestored ? 'POWER ON' : 'INSTALL FUSE'}
            </text>

            {/* Watchtower Hook Alternate Rope Exit */}
            <g transform="translate(580, 78)">
              <rect x="0" y="0" width="136" height="92" rx="10" fill="#1e293b" stroke="#f59e0b" strokeWidth="3.5" />
              <circle cx="68" cy="34" r="14" fill="none" stroke="#facc15" strokeWidth="5" />
              <text x="68" y="72" textAnchor="middle" fill="#fde047" fontSize="11.5" fontWeight="800">
                WATCHTOWER HOOK
              </text>
            </g>

            {/* Security Desk */}
            <rect x="485" y="292" width="175" height="88" rx="8" fill="#334155" stroke="#0f172a" strokeWidth="3" />
            <text x="572" y="340" textAnchor="middle" fill="#bae6fd" fontSize="12" fontWeight="700">
              SECURITY DESK
            </text>

            {/* Active Mini Distraction Drone hovering when deployed */}
            {zombie.roomId === 'gate' && zombie.state === 'distracted' && (
              <g transform="translate(495, 250)" className="animate-float-slow">
                <rect x="-22" y="-9" width="44" height="18" rx="8" fill="#38bdf8" stroke="#0f172a" strokeWidth="2.5" />
                <line x1="-26" y1="-12" x2="-6" y2="-12" stroke="#fde047" strokeWidth="3" />
                <line x1="6" y1="-12" x2="26" y2="-12" stroke="#fde047" strokeWidth="3" />
                <circle cx="0" cy="0" r="4" fill="#ef4444" />
              </g>
            )}

            {/* Gate Control Panel */}
            <rect
              x="700"
              y="190"
              width="105"
              height="95"
              rx="8"
              fill={powerRestored ? '#0284c7' : '#1e293b'}
              stroke="#0f172a"
              strokeWidth="3.5"
            />
            <text x="752" y="232" textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="800">
              GATE PANEL
            </text>
            <text x="752" y="254" textAnchor="middle" fill="#fde047" fontSize="11" fontWeight="700">
              {powerRestored ? 'ENTER PIN' : 'NO POWER'}
            </text>

            {/* BMSIT Main Gate */}
            <rect x="822" y="110" width="150" height="295" rx="10" fill="#0f172a" stroke="#fbbf24" strokeWidth="4" />
            {[848, 878, 908, 938].map((bx) => (
              <line key={bx} x1={bx} y1="120" x2={bx} y2="395" stroke="#64748b" strokeWidth="6" />
            ))}
            <text x="897" y="96" textAnchor="middle" fill="#fde047" fontSize="14" fontWeight="800">
              BMSIT MAIN GATE
            </text>
          </g>
        )}

        {/* Hidden Sticker Sparkle */}
        {room.hotspots
          .filter((h) => h.kind === 'sticker' && !collectedFlags[h.id])
          .map((st) => (
            <g
              key={st.id}
              transform={`translate(${(st.x + st.w / 2) * 10}, ${(st.y + st.h / 2) * 5.6})`}
              opacity={torchOn || ghostlyActive ? 1 : 0.45}
              className="pointer-events-none"
            >
              <polygon
                points="0,-16 5,-5 17,-4 8,4 11,16 0,10 -11,16 -8,4 -17,-4 -5,-5"
                fill="#fde047"
                stroke="#0f172a"
                strokeWidth="2"
              />
            </g>
          ))}

        {/* Realistic Students vs Distinct Zombie Person */}
        {renderPeerStudent()}
        {renderRealisticPlayer()}
        {renderZombiePerson()}

        {/* Particle Bursts */}
        {particles.map((pt) => {
          const alpha = Math.max(0, pt.life / pt.maxLife);
          return (
            <circle
              key={pt.id}
              cx={pt.x * 10}
              cy={pt.y * 5.6}
              r={pt.size}
              fill={pt.color}
              opacity={alpha}
              className="pointer-events-none"
            />
          );
        })}

        {/* Spectral Vignette Tint when Ghostly Sight is active */}
        {ghostlyActive && (
          <rect
            x="4"
            y="4"
            width="992"
            height="552"
            rx="16"
            fill="rgba(34, 211, 238, 0.08)"
            stroke="#22d3ee"
            strokeWidth="6"
            strokeDasharray="16 8"
            className="pointer-events-none"
          />
        )}

        {/* Clickable Interactive Hotspots Overlay */}
        {room.hotspots.map((spot) => {
          const sx = spot.x * 10;
          const sy = spot.y * 5.6;
          const sw = spot.w * 10;
          const sh = spot.h * 5.6;
          const labelW = Math.min(190, Math.max(96, spot.label.length * 6.8 + 18));
          const labelX = Math.min(990 - labelW, Math.max(10, sx + sw / 2 - labelW / 2));
          const labelY = sy > 42 ? sy - 24 : sy + sh + 6;
          const glowStroke =
            spot.kind === 'hazard'
              ? '#fb7185'
              : spot.kind === 'hide'
                ? '#34d399'
                : spot.kind === 'sticker'
                  ? '#fde047'
                  : '#22d3ee';

          return (
            <g
              key={spot.id}
              onClick={() => onHotspotClick(spot)}
              className="cursor-pointer group"
            >
              <rect
                x={sx}
                y={sy}
                width={sw}
                height={sh}
                rx="10"
                fill={ghostlyActive ? 'rgba(34, 211, 238, 0.16)' : 'transparent'}
                stroke={ghostlyActive ? glowStroke : 'rgba(250, 204, 21, 0)'}
                strokeWidth={ghostlyActive ? 3.5 : 3}
                strokeDasharray={ghostlyActive ? '8 5' : undefined}
                className="group-hover:stroke-amber-300/90 group-hover:fill-amber-300/10 transition-all duration-150"
              />
              {ghostlyActive && (
                <g className="pointer-events-none">
                  <rect
                    x={labelX}
                    y={labelY}
                    width={labelW}
                    height="20"
                    rx="6"
                    fill="#082f49"
                    stroke={glowStroke}
                    strokeWidth="1.5"
                  />
                  <text
                    x={labelX + labelW / 2}
                    y={labelY + 13.5}
                    textAnchor="middle"
                    fill="#ecfeff"
                    fontSize="10.5"
                    fontWeight="800"
                    fontFamily="'Plus Jakarta Sans', sans-serif"
                  >
                    {spot.label}
                  </text>
                </g>
              )}
              <title>{spot.label}</title>
            </g>
          );
        })}
      </svg>

      {/* Active Selected Item & Ghostly Sight Banners */}
      {(ghostlyActive || selectedItem) && (
        <div className="absolute top-3 left-0 right-0 flex flex-wrap items-center justify-center gap-2 px-3 pointer-events-none">
          {ghostlyActive && (
            <div className="bg-cyan-400 text-slate-950 font-extrabold text-xs px-3.5 py-1.5 rounded-full shadow-lg">
              Ghostly Sight Active · {ghostlySightTimer.toFixed(1)}s
            </div>
          )}
          {selectedItem && (
            <div className="bg-amber-400 text-slate-950 font-bold text-xs px-4 py-1.5 rounded-full shadow-lg">
              Using {ITEMS[selectedItem].name} — Click an object in the room!
            </div>
          )}
        </div>
      )}
    </div>
  );
};
