import React from 'react';
import { DIFFICULTY_SETTINGS } from '../game/adventureData';
import { AdventureDifficulty, SavedProgress } from '../game/adventureTypes';

interface AdventureTitleScreenProps {
  difficulty: AdventureDifficulty;
  onSelectDifficulty: (d: AdventureDifficulty) => void;
  onStartIntro: () => void;
  onOpenHowToPlay: () => void;
  muted: boolean;
  onToggleMute: () => void;
  saved: SavedProgress;
}

export const AdventureTitleScreen: React.FC<AdventureTitleScreenProps> = ({
  difficulty,
  onSelectDifficulty,
  onStartIntro,
  onOpenHowToPlay,
  muted,
  onToggleMute,
  saved,
}) => {
  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-[#090e20] text-slate-100 overflow-y-auto p-4 md:p-8">
      {/* Night Campus Backdrop SVG */}
      <svg
        viewBox="0 0 1200 700"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 w-full h-full pointer-events-none opacity-85"
      >
        <defs>
          <linearGradient id="nightSky" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#080c1d" />
            <stop offset="65%" stopColor="#162047" />
            <stop offset="100%" stopColor="#1c2754" />
          </linearGradient>
        </defs>
        <rect x="0" y="0" width="1200" height="700" fill="url(#nightSky)" />

        {/* Moon & Stars */}
        <circle cx="980" cy="115" r="54" fill="#fef9c3" />
        <circle cx="962" cy="105" r="46" fill="#0d1430" opacity="0.22" />
        {[
          [140, 90], [260, 140], [420, 75], [640, 110], [820, 68], [1110, 165],
        ].map(([sx, sy], i) => (
          <circle key={i} cx={sx} cy={sy} r="3" fill="#fde68a" opacity="0.8" />
        ))}

        {/* Campus Academic Silhouette */}
        <rect x="640" y="290" width="440" height="250" rx="8" fill="#101836" stroke="#233261" strokeWidth="3" />
        <rect x="780" y="235" width="160" height="65" rx="6" fill="#141e42" stroke="#233261" strokeWidth="3" />
        {[680, 750, 890, 960].map((wx) => (
          <rect key={wx} x={wx} y="330" width="44" height="58" rx="4" fill="#fbbf24" opacity="0.65" />
        ))}

        {/* Ground */}
        <rect x="0" y="535" width="1200" height="165" fill="#0b1124" />

        {/* Lamp Post */}
        <rect x="575" y="310" width="10" height="230" fill="#334155" />
        <circle cx="580" cy="302" r="18" fill="#fde047" />
        <polygon points="565,315 595,315 660,540 500,540" fill="rgba(253, 224, 71, 0.14)" />

        {/* Realistic Static Zombie Guard by the Tree */}
        <g transform="translate(1062, 435)">
          <ellipse cx="0" cy="100" rx="24" ry="7" fill="rgba(0,0,0,0.45)" />
          <rect x="-11" y="42" width="9" height="54" rx="3" fill="#0f172a" />
          <rect x="2" y="42" width="9" height="54" rx="3" fill="#0f172a" />
          {/* Tattered Guard Jacket */}
          <path d="M-16 -2 Q0 -8 16 -2 L14 44 L7 40 L0 45 L-8 41 L-14 44 Z" fill="#1e3a8a" stroke="#0f172a" strokeWidth="2" />
          {/* Reaching Zombie Arm */}
          <path d="M-16 0 L-36 -6 L-35 2 L-16 8 Z" fill="#97af90" stroke="#0f172a" strokeWidth="1.5" />
          {/* Zombie Head (pale ashy-green, sunken eyes) */}
          <ellipse cx="0" cy="-22" rx="11" ry="13" fill="#97af90" stroke="#0f172a" strokeWidth="2" />
          <circle cx="-4" cy="-23" r="2.2" fill="#1e293b" />
          <circle cx="4" cy="-23" r="2.2" fill="#1e293b" />
          <path d="M-12 -28 L12 -28 L9 -37 L-9 -37 Z" fill="#0f172a" />
        </g>

        {/* Realistic Student Running Away Toward Safety */}
        <g transform="translate(940, 442)">
          <ellipse cx="0" cy="94" rx="22" ry="6" fill="rgba(0,0,0,0.4)" />
          <path d="M-4 38 L-18 82 L-10 85 L3 42 Z" fill="#1e40af" />
          <path d="M5 38 L22 78 L14 82 L0 44 Z" fill="#1e40af" />
          <path d="M-14 -4 Q0 -10 14 -4 L12 40 L-12 40 Z" fill="#0284c7" stroke="#0f172a" strokeWidth="2" />
          <rect x="10" y="-1" width="9" height="24" rx="4" fill="#0f172a" />
          <ellipse cx="-1" cy="-22" rx="11" ry="13" fill="#e2a878" stroke="#0f172a" strokeWidth="2" />
          <path d="M-12 -25 Q0 -38 11 -25 Z" fill="#18181b" />
        </g>

        <rect x="1098" y="400" width="26" height="145" fill="#3f2718" />
        <circle cx="1110" cy="350" r="65" fill="#14332a" />
        <circle cx="1065" cy="380" r="48" fill="#194236" />
      </svg>

      {/* Main Title Card */}
      <div className="relative z-10 w-full max-w-4xl grid grid-cols-1 md:grid-cols-12 gap-8 items-center bg-[#0d142c]/92 border-2 border-indigo-400/35 rounded-3xl p-7 md:p-10 shadow-2xl">
        <div className="md:col-span-7 flex flex-col gap-5">
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-amber-300">
              6-Stage Campus Escape Adventure · Fresh Clues Every Run
            </div>
            <h1 className="font-display text-5xl md:text-6xl font-bold text-white tracking-tight mt-1 leading-none">
              Midnight at BMSIT
            </h1>
            <p className="text-sm md:text-base font-medium text-sky-200 mt-2.5">
              Easy to Play. New Codes Every Game. Two Ways Out.
            </p>
          </div>

          <p className="text-sm text-slate-300 leading-relaxed">
            Locked inside campus after midnight while finishing your project! Inspect clues, slip
            past the night staff, craft a mini drone, sip hot chai, and unlock the Main Gate or
            climb the Watchtower Wall. Every new game shuffles codes, book orders, menus, and PINs!
          </p>

          {/* Difficulty Selector */}
          <div className="flex flex-col gap-2">
            <div className="inline-flex flex-wrap gap-1.5 bg-[#090e21] p-1.5 rounded-xl border border-slate-700/80 self-start">
              {(['chill', 'standard', 'spooky'] as AdventureDifficulty[]).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => onSelectDifficulty(d)}
                  className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                    difficulty === d
                      ? 'bg-amber-400 text-slate-950'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  {DIFFICULTY_SETTINGS[d].label}
                </button>
              ))}
            </div>
            <span className="text-xs text-slate-400">
              {DIFFICULTY_SETTINGS[difficulty].summary}
            </span>
          </div>

          {/* Primary Actions */}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              type="button"
              onClick={onStartIntro}
              className="px-8 py-3.5 bg-amber-400 hover:bg-amber-300 active:scale-[0.98] text-slate-950 font-display text-2xl font-bold rounded-xl shadow-lg shadow-amber-500/20 cursor-pointer transition-all"
            >
              Play Game
            </button>
            <button
              type="button"
              onClick={onOpenHowToPlay}
              className="px-5 py-3.5 bg-[#18234a] hover:bg-[#223163] text-white text-sm font-bold rounded-xl border border-slate-600 cursor-pointer transition-colors"
            >
              How to Play
            </button>
            <button
              type="button"
              onClick={onToggleMute}
              className="px-4 py-3.5 bg-[#18234a] hover:bg-[#223163] text-slate-200 text-sm font-bold rounded-xl border border-slate-600 cursor-pointer transition-colors"
            >
              {muted ? 'Sound: Off' : 'Sound: On'}
            </button>
          </div>
        </div>

        {/* Right Preview & Best Score */}
        <div className="md:col-span-5 flex flex-col gap-3.5 bg-[#090e21]/90 border border-slate-700/80 rounded-2xl p-5">
          <div className="text-xs font-bold uppercase tracking-wider text-teal-300">
            6-Stage Escape Checklist
          </div>
          <div className="flex flex-col gap-2 text-xs text-slate-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
              <span className="font-semibold">1. Classroom</span>
              <span className="text-amber-300">Torch + Room Key</span>
            </div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
              <span className="font-semibold">2. Library</span>
              <span className="text-sky-300">Fuse + Frag A</span>
            </div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
              <span className="font-semibold">3. Robotics Lab</span>
              <span className="text-cyan-300">3D Gear + Drone</span>
            </div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
              <span className="font-semibold">4. Canteen</span>
              <span className="text-pink-300">Tray + Chai + Frag B</span>
            </div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
              <span className="font-semibold">5. Auditorium</span>
              <span className="text-purple-300">Lights + Rope + Keys</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-semibold">6. Main Gate / Wall</span>
              <span className="text-emerald-300">New PIN OR Rope</span>
            </div>
          </div>

          <div className="mt-1 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400">Local Best Score</span>
            <span className="font-mono-num text-base font-bold text-amber-300">
              {saved.bestScore} pts
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
