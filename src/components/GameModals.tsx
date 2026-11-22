import React from 'react';
import { ESCAPE_ROUTES } from '../game/campusMap';
import { HudSnapshot } from '../game/types';

interface GameModalsProps {
  hud: HudSnapshot;
  onResume: () => void;
  onRestart: () => void;
  onMainMenu: () => void;
}

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}m ${String(s).padStart(2, '0')}s`;
}

export const GameModals: React.FC<GameModalsProps> = ({
  hud,
  onResume,
  onRestart,
  onMainMenu,
}) => {
  if (hud.phase !== 'PAUSED' && hud.phase !== 'VICTORY' && hud.phase !== 'GAME_OVER') {
    return null;
  }

  const victoryDef = hud.victoryRoute ? ESCAPE_ROUTES[hud.victoryRoute] : null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#060911]/82 p-6">
      <div className="w-full max-w-md bg-[#0f1624] border border-slate-700 rounded-xl p-6 flex flex-col gap-5 shadow-2xl">
        {hud.phase === 'PAUSED' && (
          <>
            <div>
              <div className="text-xs font-semibold uppercase tracking-widest text-amber-400">
                Game Paused
              </div>
              <h2 className="font-display text-4xl font-extrabold text-white mt-1">
                Catch Your Breath
              </h2>
              <p className="text-sm text-slate-300 mt-1">
                Tip: Shoot red fuel cylinders near packs, or pull building fire alarms to lure zombies
                away from escape parts.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 border-t border-b border-slate-800 py-3 text-center">
              <div>
                <div className="text-[11px] text-slate-400">Time</div>
                <div className="font-mono-num text-base font-bold text-white">
                  {formatTime(hud.elapsedSeconds)}
                </div>
              </div>
              <div>
                <div className="text-[11px] text-slate-400">Kills</div>
                <div className="font-mono-num text-base font-bold text-white">{hud.kills}</div>
              </div>
              <div>
                <div className="text-[11px] text-slate-400">Score</div>
                <div className="font-mono-num text-base font-bold text-amber-400">{hud.score}</div>
              </div>
            </div>

            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                onClick={onResume}
                className="w-full py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Resume Escape
              </button>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={onRestart}
                  className="py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-100 text-sm font-semibold rounded-lg border border-slate-700 cursor-pointer"
                >
                  Restart Run
                </button>
                <button
                  type="button"
                  onClick={onMainMenu}
                  className="py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-100 text-sm font-semibold rounded-lg border border-slate-700 cursor-pointer"
                >
                  Title Screen
                </button>
              </div>
            </div>
          </>
        )}

        {hud.phase === 'VICTORY' && victoryDef && (
          <>
            <div>
              <div
                className="text-xs font-semibold uppercase tracking-widest"
                style={{ color: victoryDef.accentColor }}
              >
                Escaped BMSIT · {victoryDef.shortTitle}
              </div>
              <h2 className="font-display text-4xl font-extrabold text-white mt-1">
                {victoryDef.victoryTitle}
              </h2>
              <p className="text-sm text-slate-300 mt-1.5 leading-relaxed">
                {victoryDef.victorySummary}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 border-t border-b border-slate-800 py-3.5 text-sm">
              <div className="flex flex-col">
                <span className="text-xs text-slate-400">Escape Time</span>
                <span className="font-mono-num font-bold text-white text-lg">
                  {formatTime(hud.elapsedSeconds)}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-slate-400">Final Score</span>
                <span className="font-mono-num font-bold text-amber-400 text-lg">
                  {hud.score}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-slate-400">Friends Rescued</span>
                <span className="font-mono-num font-bold text-sky-300">
                  {hud.survivorsRescued}/{hud.totalSurvivors}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-slate-400">Zombies Defeated</span>
                <span className="font-mono-num font-bold text-white">{hud.kills}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={onRestart}
                className="py-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Play Again
              </button>
              <button
                type="button"
                onClick={onMainMenu}
                className="py-3 bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold rounded-lg border border-slate-700 cursor-pointer"
              >
                Try Another Route
              </button>
            </div>
          </>
        )}

        {hud.phase === 'GAME_OVER' && (
          <>
            <div>
              <div className="text-xs font-semibold uppercase tracking-widest text-red-400">
                Overrun in {hud.currentZoneName}
              </div>
              <h2 className="font-display text-4xl font-extrabold text-white mt-1">
                Campus Fall
              </h2>
              <p className="text-sm text-slate-300 mt-1">
                The horde caught up before you reached extraction. Use firecrackers [Q] and canteen
                chai counters to keep breathing room!
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 border-t border-b border-slate-800 py-3 text-center">
              <div>
                <div className="text-[11px] text-slate-400">Survived</div>
                <div className="font-mono-num text-base font-bold text-white">
                  {formatTime(hud.elapsedSeconds)}
                </div>
              </div>
              <div>
                <div className="text-[11px] text-slate-400">Kills</div>
                <div className="font-mono-num text-base font-bold text-white">{hud.kills}</div>
              </div>
              <div>
                <div className="text-[11px] text-slate-400">Score</div>
                <div className="font-mono-num text-base font-bold text-amber-400">{hud.score}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={onRestart}
                className="py-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Try Again
              </button>
              <button
                type="button"
                onClick={onMainMenu}
                className="py-3 bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold rounded-lg border border-slate-700 cursor-pointer"
              >
                Title Screen
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
