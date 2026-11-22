import React from 'react';
import { ITEMS } from '../game/adventureData';
import { ItemId, RoomDefinition } from '../game/adventureTypes';

interface AdventureHudProps {
  currentRoom: RoomDefinition;
  timeRemaining: number;
  noiseLevel: number;
  score: number;
  stickersFound: number;
  inventory: ItemId[];
  selectedItem: ItemId | null;
  dialogue: string;
  muted: boolean;
  ghostlySightTimer: number;
  zombieChasing: boolean;
  onRunAway: () => void;
  onToggleGhostlySight: () => void;
  onSelectItem: (item: ItemId | null) => void;
  onDrinkChai: () => void;
  onCombineCards: () => void;
  onOpenMap: () => void;
  onUseHint: () => void;
  onToggleMute: () => void;
  onPause: () => void;
  children?: React.ReactNode;
}

function formatTimer(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export const AdventureHud: React.FC<AdventureHudProps> = ({
  currentRoom,
  timeRemaining,
  noiseLevel,
  score,
  stickersFound,
  inventory,
  selectedItem,
  dialogue,
  muted,
  ghostlySightTimer,
  zombieChasing,
  onRunAway,
  onToggleGhostlySight,
  onSelectItem,
  onDrinkChai,
  onCombineCards,
  onOpenMap,
  onUseHint,
  onToggleMute,
  onPause,
  children,
}) => {
  const room = currentRoom;
  const canCombineCards =
    inventory.includes('card_frag_a') &&
    inventory.includes('card_frag_b') &&
    !inventory.includes('full_access_card');
  const hasChai = inventory.includes('chai_flask');
  const hasMap = inventory.includes('torn_map');
  const ghostlyActive = ghostlySightTimer > 0;

  const noiseLabel =
    noiseLevel >= 70 ? 'LOUD! ZOMBIE APPROACHING' : noiseLevel >= 40 ? 'CAREFUL · NOISY' : 'QUIET';
  const noiseBarColor =
    noiseLevel >= 70 ? 'bg-red-500' : noiseLevel >= 40 ? 'bg-amber-400' : 'bg-emerald-400';

  return (
    <div className="w-full min-h-screen flex flex-col justify-between gap-2.5 p-3 md:p-4 max-w-[1260px] mx-auto">
      {/* TOP BAR */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 items-center">
        {/* Top-Left: Level & Objective */}
        <div className="md:col-span-4 bg-[#121a35]/95 border border-slate-700/90 rounded-xl px-4 py-2.5">
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="font-bold text-amber-300 uppercase tracking-wider">
              {room.levelLabel} · {room.title}
            </span>
            <span className="font-mono-num text-slate-300 font-semibold">
              {score} pts · {stickersFound}/6 Stickers
            </span>
          </div>
          <p className="text-xs text-slate-200 mt-1 line-clamp-2">{room.objective}</p>
        </div>

        {/* Top-Center: Countdown Timer + Noise Meter */}
        <div className="md:col-span-4 bg-[#121a35]/95 border border-slate-700/90 rounded-xl px-4 py-2 flex flex-col gap-1.5">
          <div className="flex items-center justify-between gap-3">
            <span className="text-[11px] font-semibold text-slate-300">Midnight Escape Timer</span>
            <span
              className={`font-mono-num text-xl font-bold ${
                timeRemaining <= 60 ? 'text-red-400' : 'text-amber-300'
              }`}
            >
              {formatTimer(timeRemaining)}
            </span>
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-[11px] font-bold">
              <span
                className={
                  noiseLevel >= 70
                    ? 'text-red-400'
                    : noiseLevel >= 40
                      ? 'text-amber-300'
                      : 'text-emerald-300'
                }
              >
                Noise: {Math.round(noiseLevel)}% · {noiseLabel}
              </span>
            </div>
            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full transition-[width] duration-150 ${noiseBarColor}`}
                style={{ width: `${Math.min(100, Math.max(0, noiseLevel))}%` }}
              />
            </div>
          </div>
        </div>

        {/* Top-Right: Run Away (when zombie near), Ghostly Sight, Hint, Map, Sound, Pause */}
        <div className="md:col-span-4 flex flex-wrap items-center justify-start md:justify-end gap-2">
          {zombieChasing && (
            <button
              type="button"
              onClick={onRunAway}
              className="min-h-[42px] px-3.5 py-2 text-xs font-extrabold bg-rose-500 hover:bg-rose-400 text-white border border-white rounded-xl cursor-pointer animate-pulse"
            >
              Run Away!
            </button>
          )}
          <button
            type="button"
            aria-pressed={ghostlyActive}
            onClick={onToggleGhostlySight}
            title="Spooky Power: Highlights all interactive hotspots for 3 seconds (costs 10% of remaining time)"
            className={`min-h-[42px] px-3 py-2 text-xs font-bold rounded-xl border cursor-pointer transition-all ${
              ghostlyActive
                ? 'bg-cyan-400 text-slate-950 border-white shadow-lg shadow-cyan-400/30 animate-pulse'
                : 'bg-[#1c1a42] hover:bg-[#282461] text-cyan-200 border-cyan-400/60'
            }`}
          >
            {ghostlyActive
              ? `Ghostly Sight (${ghostlySightTimer.toFixed(1)}s)`
              : 'Ghostly Sight (-10% Time)'}
          </button>
          {hasMap && (
            <button
              type="button"
              onClick={onOpenMap}
              className="min-h-[42px] px-3.5 py-2 text-xs font-bold bg-[#1c284f] hover:bg-[#263669] text-orange-200 border border-orange-400/50 rounded-xl cursor-pointer"
            >
              Campus Map
            </button>
          )}
          <button
            type="button"
            onClick={onUseHint}
            className="min-h-[42px] px-3.5 py-2 text-xs font-bold bg-[#1c284f] hover:bg-[#263669] text-amber-300 border border-amber-400/50 rounded-xl cursor-pointer"
          >
            Hint (-10)
          </button>
          <button
            type="button"
            onClick={onToggleMute}
            className="min-h-[42px] px-3.5 py-2 text-xs font-bold bg-[#121a35] hover:bg-[#1a2549] text-slate-200 border border-slate-700 rounded-xl cursor-pointer"
          >
            {muted ? 'Unmute' : 'Mute'}
          </button>
          <button
            type="button"
            onClick={onPause}
            className="min-h-[42px] px-4 py-2 text-xs font-bold bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl cursor-pointer"
          >
            Pause
          </button>
        </div>
      </div>

      {/* CENTER PLAYABLE SCENE */}
      <div className="flex-1 flex items-center justify-center min-h-0">{children}</div>

      {/* BOTTOM BAR: Dialogue + Inventory */}
      <div className="flex flex-col gap-2">
        {/* Comic Dialogue Box */}
        <div className="bg-[#0e152c]/95 border border-indigo-400/40 rounded-xl px-4 py-2.5 flex items-center justify-between gap-4">
          <p className="text-xs md:text-sm font-medium text-slate-100 leading-snug">{dialogue}</p>
          {selectedItem && (
            <button
              type="button"
              onClick={() => onSelectItem(null)}
              className="shrink-0 px-3 py-1 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg cursor-pointer"
            >
              Put Away
            </button>
          )}
        </div>

        {/* Inventory Slots */}
        <div className="bg-[#121a35]/95 border border-slate-700/90 rounded-xl p-2.5 flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-2">
            Backpack ({inventory.length})
          </span>

          {inventory.length === 0 && (
            <span className="text-xs text-slate-400">
              Empty — Click highlighted objects in the room to search for clues &amp; gear!
            </span>
          )}

          {inventory.map((id) => {
            const item = ITEMS[id];
            const active = selectedItem === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => {
                  if (id === 'chai_flask') {
                    onDrinkChai();
                  } else {
                    onSelectItem(active ? null : id);
                  }
                }}
                title={item.description}
                className={`min-h-[42px] px-3 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-2 cursor-pointer transition-all ${
                  active
                    ? 'bg-amber-400 text-slate-950 border-white scale-[1.03]'
                    : 'bg-[#1a2448] hover:bg-[#243261] text-slate-100 border-slate-600'
                }`}
              >
                <span
                  className="w-3 h-3 rounded-full shrink-0 border border-slate-900"
                  style={{ backgroundColor: item.color }}
                />
                <span className="whitespace-nowrap">{item.shortName}</span>
              </button>
            );
          })}

          {hasChai && (
            <button
              type="button"
              onClick={onDrinkChai}
              className="min-h-[42px] px-3.5 py-1.5 rounded-lg bg-teal-400 hover:bg-teal-300 text-slate-950 text-xs font-extrabold cursor-pointer"
            >
              Sip Chai (-35% Noise)
            </button>
          )}

          {canCombineCards && (
            <button
              type="button"
              onClick={onCombineCards}
              className="ml-auto min-h-[42px] px-4 py-1.5 rounded-lg bg-emerald-400 hover:bg-emerald-300 text-slate-950 text-xs font-extrabold cursor-pointer animate-pulse"
            >
              Combine Card Fragments A + B
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
