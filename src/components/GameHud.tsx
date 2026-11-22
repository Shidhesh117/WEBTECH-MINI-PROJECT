import React from 'react';
import { ESCAPE_ROUTES } from '../game/campusMap';
import { EscapeRouteId, HudSnapshot, WeaponId } from '../game/types';

interface GameHudProps {
  hud: HudSnapshot;
  muted: boolean;
  onToggleMute: () => void;
  onTogglePause: () => void;
  onToggleAutoAim: () => void;
  onSelectRoute: (routeId: EscapeRouteId) => void;
  onSelectWeapon: (weapon: WeaponId) => void;
  onMiniGameInput: (input: string) => void;
  onCancelMiniGame: () => void;
}

function formatClock(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export const GameHud: React.FC<GameHudProps> = ({
  hud,
  muted,
  onToggleMute,
  onTogglePause,
  onToggleAutoAim,
  onSelectRoute,
  onSelectWeapon,
  onMiniGameInput,
  onCancelMiniGame,
}) => {
  const trackedDef = ESCAPE_ROUTES[hud.trackedRoute];
  const trackedProgress = hud.routeProgress[hud.trackedRoute];
  const hpPct = Math.max(0, Math.min(100, (hud.hp / hud.maxHp) * 100));
  const stamPct = Math.max(0, Math.min(100, (hud.stamina / hud.maxStamina) * 100));

  return (
    <div className="fixed inset-0 z-20 pointer-events-none p-4 flex flex-col justify-between">
      {/* TOP BAR CLUSTER */}
      <div className="flex items-start justify-between gap-4">
        {/* Top-Left: Vitals, Friends & Score */}
        <div className="bg-[#0d131f]/90 border border-slate-700/80 rounded-lg px-4 py-3 flex flex-col gap-2 min-w-[248px]">
          <div className="flex items-center justify-between gap-4 text-xs">
            <span className="font-semibold text-slate-200 truncate max-w-[160px]">
              {hud.currentZoneName}
            </span>
            <span className="font-mono-num text-amber-400 font-bold">
              {formatClock(hud.elapsedSeconds)}
            </span>
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-[11px] font-mono-num">
              <span className={hud.hp <= 30 ? 'text-red-400 font-bold' : 'text-slate-300'}>
                HP {hud.hp}/{hud.maxHp}
              </span>
              <span className="text-sky-300 font-semibold">
                Team {hud.survivorsRescued}/{hud.totalSurvivors} · Kills {hud.kills}
              </span>
            </div>
            <div className="h-2 w-full bg-slate-800 rounded-sm overflow-hidden">
              <div
                className={`h-full transition-[width] duration-100 ${
                  hud.hp <= 30 ? 'bg-red-500' : 'bg-emerald-400'
                }`}
                style={{ width: `${hpPct}%` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono-num text-slate-400 w-12 shrink-0">
              {hud.speedBoostTimer > 0 ? 'BOOST' : 'STAM'}
            </span>
            <div className="h-1.5 flex-1 bg-slate-800 rounded-sm overflow-hidden">
              <div
                className={`h-full transition-[width] duration-100 ${
                  hud.speedBoostTimer > 0 ? 'bg-amber-400' : 'bg-sky-400'
                }`}
                style={{ width: `${stamPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Top-Center: Banners */}
        <div className="flex flex-col items-center gap-2 max-w-md">
          {hud.chopperHoldoutActive && (
            <div className="bg-[#0d131f]/95 border border-sky-400 rounded-lg px-5 py-2.5 text-center">
              <div className="text-xs font-semibold text-sky-300 uppercase tracking-wider">
                Chopper Inbound · Defend Academic Block
              </div>
              <div className="font-mono-num text-2xl font-bold text-white">
                {hud.chopperHoldoutRemaining.toFixed(1)}s
              </div>
            </div>
          )}

          {hud.activeAlarmZone && hud.activeAlarmRemaining > 0 && (
            <div className="bg-[#0d131f]/92 border border-red-500/80 rounded-lg px-4 py-1.5 text-xs font-medium text-red-300 font-mono-num">
              Siren Luring Horde: {hud.activeAlarmZone} ({Math.ceil(hud.activeAlarmRemaining)}s)
            </div>
          )}

          {hud.bannerMessage && (
            <div className="bg-[#0d131f]/95 border border-amber-400/70 rounded-lg px-4 py-2 text-xs md:text-sm font-medium text-amber-100 text-center">
              {hud.bannerMessage}
            </div>
          )}
        </div>

        {/* Top-Right: Escape Plan & Quick Controls */}
        <div className="flex items-start gap-2 pointer-events-auto">
          <div className="bg-[#0d131f]/92 border border-slate-700/80 rounded-lg p-3 flex flex-col gap-2 w-[264px]">
            <div className="flex items-center justify-between gap-1 bg-slate-900/90 p-1 rounded-md">
              {(['bus', 'chopper', 'tunnel', 'glider'] as EscapeRouteId[]).map((rId) => {
                const rDef = ESCAPE_ROUTES[rId];
                const prog = hud.routeProgress[rId];
                const active = hud.trackedRoute === rId;
                return (
                  <button
                    key={rId}
                    type="button"
                    onClick={() => onSelectRoute(rId)}
                    className={`flex-1 py-1 px-1.5 text-[11px] font-semibold rounded transition-colors whitespace-nowrap cursor-pointer ${
                      active ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {rDef.shortTitle.split(' ')[0]} {prog.collected}/{prog.total}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold" style={{ color: trackedDef.accentColor }}>
                {trackedDef.title}
              </span>
              {hud.targetDistanceMeters !== null && (
                <span className="font-mono-num text-slate-400">{hud.targetDistanceMeters}m</span>
              )}
            </div>

            <div className="flex flex-col gap-1">
              {trackedProgress.partNames.map((pt) => (
                <div
                  key={pt.id}
                  className={`flex items-center justify-between text-[11px] ${
                    pt.collected ? 'text-emerald-400 line-through opacity-75' : 'text-slate-200'
                  }`}
                >
                  <span className="truncate">{pt.name}</span>
                  <span className="text-[10px] text-slate-400 shrink-0 ml-2">
                    {pt.collected ? 'Done' : pt.locationHint.split('(')[0]}
                  </span>
                </div>
              ))}
              {trackedProgress.ready && (
                <div className="text-[11px] font-semibold text-amber-300 pt-0.5">
                  Ready! Head to {trackedDef.extractionName} [E]
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <button
              type="button"
              onClick={onTogglePause}
              className="px-3 py-1.5 text-xs font-semibold bg-[#0d131f]/92 border border-slate-700/80 rounded-lg text-slate-200 hover:border-slate-500 cursor-pointer whitespace-nowrap"
            >
              Pause
            </button>
            <button
              type="button"
              onClick={onToggleAutoAim}
              className={`px-3 py-1.5 text-xs font-semibold bg-[#0d131f]/92 border rounded-lg cursor-pointer whitespace-nowrap ${
                hud.autoAim
                  ? 'border-emerald-500/70 text-emerald-300'
                  : 'border-slate-700/80 text-slate-400'
              }`}
            >
              {hud.autoAim ? 'Easy Aim: On' : 'Easy Aim: Off'}
            </button>
            <button
              type="button"
              onClick={onToggleMute}
              className="px-3 py-1.5 text-xs font-semibold bg-[#0d131f]/92 border border-slate-700/80 rounded-lg text-slate-200 hover:border-slate-500 cursor-pointer whitespace-nowrap"
            >
              {muted ? 'Unmute' : 'Mute'}
            </button>
          </div>
        </div>
      </div>

      {/* CENTER EXTRACTION MINI-CHALLENGE MODAL */}
      {hud.miniGame?.active && (
        <div className="self-center my-auto pointer-events-auto bg-[#0d131f] border-2 border-amber-400 rounded-xl p-5 w-full max-w-sm shadow-2xl flex flex-col gap-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-display text-2xl font-bold text-white leading-tight">
                {hud.miniGame.title}
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">{hud.miniGame.subtitle}</p>
            </div>
            <button
              type="button"
              onClick={onCancelMiniGame}
              className="px-2.5 py-1 text-xs font-semibold text-slate-300 bg-slate-800 rounded hover:bg-slate-700 cursor-pointer"
            >
              Back
            </button>
          </div>

          {hud.miniGame.routeId === 'bus' && hud.miniGame.sequence && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-center gap-2">
                {hud.miniGame.sequence.map((key, idx) => {
                  const done = idx < (hud.miniGame?.sequenceIndex ?? 0);
                  const current = idx === (hud.miniGame?.sequenceIndex ?? 0);
                  return (
                    <div
                      key={`${key}-${idx}`}
                      className={`w-12 h-12 rounded-lg border-2 flex items-center justify-center font-mono-num text-lg font-bold ${
                        done
                          ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                          : current
                            ? 'bg-amber-400/20 border-amber-400 text-amber-300'
                            : 'bg-slate-900 border-slate-700 text-slate-400'
                      }`}
                    >
                      {key}
                    </div>
                  );
                })}
              </div>
              <div className="grid grid-cols-4 gap-2">
                {(['W', 'A', 'S', 'D'] as const).map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => onMiniGameInput(k)}
                    className="py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-mono-num font-bold rounded-lg border border-slate-600 cursor-pointer"
                  >
                    {k}
                  </button>
                ))}
              </div>
            </div>
          )}

          {hud.miniGame.routeId === 'tunnel' && hud.miniGame.circuitOrder && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-center gap-2 text-xs text-slate-300 font-mono-num">
                Target Order:
                {hud.miniGame.circuitOrder.map((n, idx) => (
                  <span
                    key={`${n}-${idx}`}
                    className={`px-2.5 py-0.5 rounded ${
                      idx < (hud.miniGame?.circuitStep ?? 0)
                        ? 'bg-emerald-500/25 text-emerald-300'
                        : idx === (hud.miniGame?.circuitStep ?? 0)
                          ? 'bg-violet-500/30 text-violet-200 font-bold'
                          : 'text-slate-400'
                    }`}
                  >
                    {n}
                  </span>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => onMiniGameInput(String(num))}
                    className="py-3 bg-slate-800 hover:bg-violet-600/40 text-white font-mono-num font-bold text-lg rounded-lg border border-slate-600 cursor-pointer"
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>
          )}

          {hud.miniGame.routeId === 'glider' && hud.miniGame.chargeProgress !== undefined && (
            <div className="flex flex-col gap-3">
              <div className="h-4 w-full bg-slate-800 rounded overflow-hidden border border-slate-700">
                <div
                  className="h-full bg-amber-400 transition-[width] duration-75"
                  style={{ width: `${hud.miniGame.chargeProgress}%` }}
                />
              </div>
              <button
                type="button"
                onClick={() => onMiniGameInput('PUMP')}
                className="py-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-display text-xl font-extrabold uppercase rounded-lg cursor-pointer"
              >
                Boost Thrusters ({hud.miniGame.chargeProgress}%)
              </button>
            </div>
          )}
        </div>
      )}

      {/* BOTTOM BAR CLUSTER */}
      <div className="flex items-end justify-between gap-4">
        <div className="flex items-center gap-2 pointer-events-auto">
          {[
            {
              id: 'bat' as WeaponId,
              key: '1',
              name: 'Cricket Bat',
              sub: 'Melee',
              locked: false,
            },
            {
              id: 'nailgun' as WeaponId,
              key: '2',
              name: 'Nailgun',
              sub: hud.reloadingTimer > 0 ? 'Reload...' : `${hud.nailMag}/${hud.nailAmmo}`,
              locked: false,
            },
            {
              id: 'tesla' as WeaponId,
              key: '3',
              name: 'Tesla Coil',
              sub: hud.unlockedWeapons.tesla ? `${hud.teslaEnergy}/${hud.teslaMaxEnergy}` : 'Academic Lab',
              locked: !hud.unlockedWeapons.tesla,
            },
          ].map((w) => {
            const active = hud.activeWeapon === w.id;
            return (
              <button
                key={w.id}
                type="button"
                disabled={w.locked}
                onClick={() => onSelectWeapon(w.id)}
                className={`px-3 py-2 rounded-lg border text-left transition-colors min-w-[104px] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                  active
                    ? 'bg-[#162033] border-amber-400 text-white'
                    : 'bg-[#0d131f]/90 border-slate-700/80 text-slate-300 hover:border-slate-500'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] font-mono-num text-slate-400">
                  <span>[{w.key}]</span>
                  <span>{w.sub}</span>
                </div>
                <div className="text-xs font-semibold truncate mt-0.5">{w.name}</div>
              </button>
            );
          })}

          <div className="px-3 py-2 rounded-lg border bg-[#0d131f]/90 border-slate-700/80 text-slate-200 min-w-[92px]">
            <div className="flex items-center justify-between text-[10px] font-mono-num text-orange-300">
              <span>[Q]</span>
              <span>Decoy</span>
            </div>
            <div className="text-xs font-semibold font-mono-num mt-0.5">
              {hud.decoys} Firecrackers
            </div>
          </div>
        </div>

        {/* Bottom-Center: Context Interaction Prompt */}
        <div className="flex-1 flex justify-center">
          {hud.contextPrompt && !hud.miniGame?.active && (
            <div className="bg-[#0d131f]/95 border border-amber-400/80 rounded-lg px-4 py-2 text-xs md:text-sm font-semibold text-amber-200 whitespace-nowrap">
              {hud.contextPrompt}
            </div>
          )}
        </div>

        {/* Bottom-Right: Live Campus Radar Minimap */}
        <div className="bg-[#0d131f]/92 border border-slate-700/80 rounded-lg p-2 flex flex-col gap-1">
          <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono-num px-0.5">
            <span>CAMPUS RADAR</span>
            <span>W{hud.waveLevel}</span>
          </div>
          <svg
            viewBox={`0 0 ${hud.worldW} ${hud.worldH}`}
            className="w-[164px] h-[123px] bg-[#090e17] rounded border border-slate-800"
          >
            <rect x="140" y="130" width="700" height="490" fill="#1e293b" />
            <rect x="960" y="120" width="480" height="320" fill="#1e293b" />
            <rect x="1560" y="130" width="700" height="470" fill="#1e293b" />
            <rect x="140" y="740" width="440" height="340" fill="#1e293b" />
            <rect x="1620" y="720" width="640" height="400" fill="#172b24" />
            <rect x="140" y="1200" width="640" height="460" fill="#1e293b" />
            <rect x="900" y="1320" width="600" height="400" fill="#1c2430" />
            <rect x="1620" y="1240" width="640" height="420" fill="#1e293b" />

            {hud.minimapBlips.map((b, i) => {
              if (b.kind === 'zombie') {
                return <circle key={i} cx={b.x} cy={b.y} r="20" fill="#ef4444" opacity="0.6" />;
              }
              if (b.kind === 'human') {
                return <circle key={i} cx={b.x} cy={b.y} r="30" fill={b.color} />;
              }
              if (b.kind === 'part') {
                return <rect key={i} x={b.x - 32} y={b.y - 32} width="64" height="64" fill={b.color} />;
              }
              return (
                <circle
                  key={i}
                  cx={b.x}
                  cy={b.y}
                  r="48"
                  fill="none"
                  stroke={b.color}
                  strokeWidth="18"
                />
              );
            })}

            <circle cx={hud.playerX} cy={hud.playerY} r="44" fill="#38bdf8" stroke="#ffffff" strokeWidth="14" />
          </svg>
        </div>
      </div>
    </div>
  );
};
