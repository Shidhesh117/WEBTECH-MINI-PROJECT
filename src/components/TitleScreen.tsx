import React, { useEffect, useState } from 'react';
import { Difficulty } from '../game/types';

interface TitleScreenProps {
  difficulty: Difficulty;
  onSelectDifficulty: (d: Difficulty) => void;
  onStart: () => void;
  muted: boolean;
  onToggleMute: () => void;
}

const DIFFICULTIES: { id: Difficulty; label: string }[] = [
  { id: 'freshman', label: 'Easy' },
  { id: 'senior', label: 'Normal' },
  { id: 'nightmare', label: 'Hard' },
];

export const TitleScreen: React.FC<TitleScreenProps> = ({
  difficulty,
  onSelectDifficulty,
  onStart,
  muted,
  onToggleMute,
}) => {
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Enter' || e.code === 'Space') {
        e.preventDefault();
        onStart();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onStart]);

  return (
    <div className="fixed inset-0 z-30 flex items-center bg-[#090d16] text-slate-100 overflow-hidden">
      {/* Key-Art Backdrop */}
      {!imgFailed ? (
        <img
          src="/src/assets/images/bmsit_campus_outbreak_hero_1795326662148.jpg"
          alt="BMSIT college campus at night during a zombie outbreak"
          referrerPolicy="no-referrer"
          onError={() => setImgFailed(true)}
          className="absolute inset-0 h-full w-full object-cover object-right opacity-95"
        />
      ) : (
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(circle at 72% 45%, rgba(245, 158, 11, 0.18), transparent 48%), linear-gradient(120deg, #090d16 35%, #162235 100%)',
          }}
        />
      )}

      {/* Measured Left-to-Right Contrast Scrim */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(90deg, rgba(9, 13, 22, 0.94) 0%, rgba(9, 13, 22, 0.82) 38%, rgba(9, 13, 22, 0.28) 72%, rgba(9, 13, 22, 0.18) 100%)',
        }}
      />

      {/* Audio Toggle Top-Right */}
      <button
        type="button"
        onClick={onToggleMute}
        className="absolute top-6 right-6 z-20 px-4 py-2 text-xs font-semibold tracking-wide text-slate-200 bg-[#121926] border border-slate-700/80 rounded-lg hover:border-amber-400/70 hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
      >
        {muted ? 'Sound: Off' : 'Sound: On'}
      </button>

      {/* Clean, Direct Left Lockup */}
      <div className="relative z-10 max-w-lg px-8 md:px-14 py-10 flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <div className="text-xs font-semibold tracking-widest uppercase text-amber-400">
            BMSIT Campus Survival
          </div>

          <svg
            viewBox="0 0 460 112"
            className="w-full max-w-[430px] h-auto"
            role="img"
            aria-label="BMSIT Outbreak: Campus Escape"
          >
            <defs>
              <linearGradient id="titleAmber" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#fbbf24" />
                <stop offset="100%" stopColor="#f97316" />
              </linearGradient>
            </defs>
            <polygon
              points="18,14 48,14 58,34 42,68 24,68 8,34"
              fill="#151e2e"
              stroke="#fbbf24"
              strokeWidth="2.5"
            />
            <path d="M33 23 L26 42 H35 L30 58 L43 37 H34 Z" fill="#fbbf24" />
            <text
              x="74"
              y="52"
              fill="#f8fafc"
              fontFamily="'Barlow Condensed', sans-serif"
              fontWeight="800"
              fontSize="50"
              letterSpacing="1.5"
            >
              BMSIT OUTBREAK
            </text>
            <rect x="74" y="63" width="210" height="3" fill="url(#titleAmber)" rx="1.5" />
            <text
              x="74"
              y="92"
              fill="#cbd5e1"
              fontFamily="'Barlow Condensed', sans-serif"
              fontWeight="700"
              fontSize="24"
              letterSpacing="4"
            >
              CAMPUS ESCAPE
            </text>
          </svg>

          <p className="text-base text-slate-200 leading-relaxed max-w-md text-balance">
            Rescue stranded friends, fight off the horde, and escape campus by bus, chopper,
            tunnel, or glider.
          </p>
        </div>

        {/* Difficulty + Primary Play CTA */}
        <div className="flex flex-col gap-4">
          <div className="inline-flex self-start items-center gap-1 p-1 bg-[#121926] border border-slate-800 rounded-lg">
            {DIFFICULTIES.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => onSelectDifficulty(d.id)}
                className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  difficulty === d.id
                    ? 'bg-amber-400 text-slate-950'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={onStart}
              className="px-8 py-3.5 bg-amber-400 hover:bg-amber-300 active:scale-[0.99] text-slate-950 font-display text-2xl font-extrabold tracking-wide uppercase rounded-lg transition-all shadow-lg shadow-amber-500/20 whitespace-nowrap shrink-0 cursor-pointer"
            >
              Play Now
            </button>
            <span className="text-xs text-slate-400">or press Enter</span>
          </div>
        </div>

        {/* Single Flat Control Hint */}
        <p className="text-xs text-slate-400 tracking-wide">
          WASD Move · Click or Space Shoot · E Interact · Q Decoy · Esc Pause
        </p>
      </div>
    </div>
  );
};
