import React from 'react';
import { getPlayerRank } from '../game/adventureData';
import { AdventureScreen, RoomDefinition } from '../game/adventureTypes';

interface AdventureModalsProps {
  screen: AdventureScreen;
  showHowToPlay: boolean;
  currentRoom: RoomDefinition;
  score: number;
  timeRemaining: number;
  stickersFound: number;
  hintsUsed: number;
  noiseAlerts: number;
  escapeMethod: 'gate' | 'rope';
  gameOverReason: string;
  muted: boolean;
  onCloseHowToPlay: () => void;
  onStartLevelOne: () => void;
  onContinueNextRoom: () => void;
  onResume: () => void;
  onRestart: () => void;
  onReturnTitle: () => void;
  onToggleMute: () => void;
}

function formatClock(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}m ${String(s).padStart(2, '0')}s`;
}

export const AdventureModals: React.FC<AdventureModalsProps> = ({
  screen,
  showHowToPlay,
  currentRoom,
  score,
  timeRemaining,
  stickersFound,
  hintsUsed,
  noiseAlerts,
  escapeMethod,
  gameOverReason,
  muted,
  onCloseHowToPlay,
  onStartLevelOne,
  onContinueNextRoom,
  onResume,
  onRestart,
  onReturnTitle,
  onToggleMute,
}) => {
  if (showHowToPlay) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#060916]/85 p-4">
        <div className="w-full max-w-lg bg-[#121a35] border-2 border-indigo-400/60 rounded-2xl p-6 shadow-2xl flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-3xl font-bold text-white">How to Play</h2>
            <button
              type="button"
              onClick={onCloseHowToPlay}
              className="px-3 py-1.5 text-xs font-bold bg-slate-800 text-slate-200 rounded-lg cursor-pointer"
            >
              Close
            </button>
          </div>
          <div className="flex flex-col gap-2.5 text-sm text-slate-200 leading-relaxed">
            <p>
              <strong>1. Easy One-Click Exploration:</strong> Click boards, desks, printers, and
              doors to read clues and pick up items. Needed keys, fuses, and gears work
              automatically once they are in your Backpack!
            </p>
            <p>
              <strong>2. Fresh Clues Every Game:</strong> Codes, book sequences, wiring orders,
              canteen combos, spotlight colors, and the Gate PIN are freshly randomized on every run!
            </p>
            <p>
              <strong>3. Ghostly Sight &amp; Masala Chai:</strong> Click{' '}
              <em>Ghostly Sight</em> anytime in the top bar to reveal every clickable object for 3
              seconds (-10% time), or sip <em>Chai</em> to lower Noise.
            </p>
            <p>
              <strong>4. Two Ways Out on Stage 6:</strong> Restore power and enter the Noticeboard
              PIN at the Gate Control Panel — OR climb out at the Watchtower Wall using your Rope!
            </p>
          </div>
          <button
            type="button"
            onClick={onCloseHowToPlay}
            className="w-full py-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-xl cursor-pointer"
          >
            Got It!
          </button>
        </div>
      </div>
    );
  }

  if (screen === 'INTRO') {
    return (
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#070b1a]/92 p-4">
        <div className="w-full max-w-xl bg-[#121a35] border-2 border-amber-400/70 rounded-2xl p-6 md:p-8 shadow-2xl flex flex-col gap-5">
          <div className="text-xs font-bold uppercase tracking-widest text-amber-300">
            12:00 AM · BMSIT Campus
          </div>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-white leading-tight">
            Locked In After Midnight!
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs md:text-sm">
            <div className="bg-[#0b1024] border border-slate-700 rounded-xl p-4 flex flex-col gap-2">
              <div className="font-bold text-sky-300">Late Night Project Crunch</div>
              <p className="text-slate-300">
                You stayed behind to polish one last feature. Suddenly the lights go out and the
                automatic campus shutters lock behind you!
              </p>
            </div>
            <div className="bg-[#0b1024] border border-slate-700 rounded-xl p-4 flex flex-col gap-2">
              <div className="font-bold text-emerald-300">Keep Students Safe &amp; Run!</div>
              <p className="text-slate-300">
                Zombie people roam each block! Keep your distance—if one spots you or hears noise,
                run to cover or click away across the room while fellow students flee!
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onStartLevelOne}
            className="w-full py-3.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-display text-2xl font-bold rounded-xl cursor-pointer"
          >
            Enter Stage 1: Classroom Block
          </button>
        </div>
      </div>
    );
  }

  if (screen === 'LEVEL_TRANSITION') {
    return (
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#060916]/88 p-4">
        <div className="w-full max-w-md bg-[#121a35] border-2 border-emerald-400/70 rounded-2xl p-6 shadow-2xl flex flex-col gap-4 text-center">
          <div className="text-xs font-bold uppercase tracking-widest text-emerald-300">
            Area Unlocked · +100 pts
          </div>
          <h2 className="font-display text-3xl font-bold text-white">
            {currentRoom.levelLabel}: {currentRoom.title}
          </h2>
          <p className="text-sm text-slate-200 italic">&ldquo;{currentRoom.introQuote}&rdquo;</p>
          <p className="text-xs text-amber-200 bg-[#0b1024] rounded-xl p-3 border border-slate-700">
            <strong>Goal:</strong> {currentRoom.objective}
          </p>
          <button
            type="button"
            onClick={onContinueNextRoom}
            className="w-full py-3 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-display text-xl font-bold rounded-xl cursor-pointer"
          >
            Step Inside
          </button>
        </div>
      </div>
    );
  }

  if (screen === 'PAUSED') {
    return (
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#060916]/85 p-4">
        <div className="w-full max-w-sm bg-[#121a35] border-2 border-slate-600 rounded-2xl p-6 shadow-2xl flex flex-col gap-4">
          <h2 className="font-display text-3xl font-bold text-white text-center">Game Paused</h2>
          <p className="text-xs text-slate-300 text-center">
            Timer and zombie patrols are safely paused.
          </p>
          <div className="flex flex-col gap-2.5">
            <button
              type="button"
              onClick={onResume}
              className="py-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-xl cursor-pointer"
            >
              Resume Adventure
            </button>
            <button
              type="button"
              onClick={onToggleMute}
              className="py-2.5 bg-[#1b264e] hover:bg-[#243368] text-white text-sm font-bold rounded-xl border border-slate-600 cursor-pointer"
            >
              {muted ? 'Sound: Off (Turn On)' : 'Sound: On (Mute)'}
            </button>
            <button
              type="button"
              onClick={onRestart}
              className="py-2.5 bg-[#1b264e] hover:bg-[#243368] text-white text-sm font-bold rounded-xl border border-slate-600 cursor-pointer"
            >
              Restart Game
            </button>
            <button
              type="button"
              onClick={onReturnTitle}
              className="py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-bold rounded-xl cursor-pointer"
            >
              Return to Title
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (screen === 'GAME_OVER') {
    return (
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#060916]/90 p-4">
        <div className="w-full max-w-md bg-[#121a35] border-2 border-red-400/70 rounded-2xl p-6 shadow-2xl flex flex-col gap-4 text-center">
          <div className="text-xs font-bold uppercase tracking-widest text-red-400">
            Morning Bell Rang!
          </div>
          <h2 className="font-display text-4xl font-bold text-white">Detention at Dawn</h2>
          <p className="text-sm text-slate-200">{gameOverReason}</p>
          <div className="bg-[#0b1024] rounded-xl p-3 border border-slate-700 flex justify-around text-xs">
            <div>
              <div className="text-slate-400">Score</div>
              <div className="font-mono-num text-base font-bold text-amber-300">{score}</div>
            </div>
            <div>
              <div className="text-slate-400">Stickers</div>
              <div className="font-mono-num text-base font-bold text-white">{stickersFound}/6</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={onRestart}
              className="py-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-xl cursor-pointer"
            >
              Retry Escape
            </button>
            <button
              type="button"
              onClick={onReturnTitle}
              className="py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl cursor-pointer"
            >
              Title Screen
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (screen === 'VICTORY') {
    const rank = getPlayerRank(score);
    return (
      <div
        className="fixed inset-0 z-40 flex items-center justify-center p-4"
        style={{
          background:
            'linear-gradient(180deg, rgba(251, 146, 60, 0.35) 0%, rgba(15, 23, 42, 0.94) 60%)',
        }}
      >
        <div className="w-full max-w-md bg-[#121a35] border-2 border-amber-300 rounded-2xl p-6 shadow-2xl flex flex-col gap-4 text-center">
          <div className="text-xs font-bold uppercase tracking-widest text-amber-300">
            {escapeMethod === 'rope'
              ? 'Sunrise Escape · Grappled Over the Watchtower Wall!'
              : 'Sunrise Escape · Unlocked the BMSIT Main Gate!'}
          </div>
          <h2 className="font-display text-4xl font-bold text-white">You Escaped BMSIT!</h2>
          <div className="bg-amber-400/15 border border-amber-400/50 rounded-xl p-3">
            <div className="text-xs text-amber-200 uppercase font-bold">Rank Earned</div>
            <div className="font-display text-2xl font-bold text-amber-300">{rank.title}</div>
            <p className="text-xs text-slate-200 mt-0.5">{rank.line}</p>
          </div>

          <div className="grid grid-cols-2 gap-3 bg-[#0b1024] rounded-xl p-3.5 border border-slate-700 text-xs">
            <div>
              <div className="text-slate-400">Total Score</div>
              <div className="font-mono-num text-lg font-bold text-amber-300">{score}</div>
            </div>
            <div>
              <div className="text-slate-400">Time Left</div>
              <div className="font-mono-num text-lg font-bold text-emerald-300">
                {formatClock(timeRemaining)}
              </div>
            </div>
            <div>
              <div className="text-slate-400">Hidden Stickers</div>
              <div className="font-mono-num font-bold text-white">{stickersFound}/6</div>
            </div>
            <div>
              <div className="text-slate-400">Hints · Alerts</div>
              <div className="font-mono-num font-bold text-slate-200">
                {hintsUsed} · {noiseAlerts}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={onRestart}
              className="py-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-xl cursor-pointer"
            >
              Play Again
            </button>
            <button
              type="button"
              onClick={onReturnTitle}
              className="py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl cursor-pointer"
            >
              Title Screen
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
