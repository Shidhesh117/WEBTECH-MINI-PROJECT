import React, { useState } from 'react';
import {
  BOOK_OPTIONS,
  CIRCUIT_OPTIONS,
  FOOD_OPTIONS,
  getBookLabel,
  getCircuitLabel,
  getFoodLabel,
  SPOTLIGHT_COLORS,
} from '../game/adventureData';
import { PuzzleId, RoomId, RunConfig, SpotlightColor } from '../game/adventureTypes';

interface PuzzleModalProps {
  puzzleId: PuzzleId | null;
  currentRoom: RoomId;
  runConfig: RunConfig;
  powerRestored: boolean;
  hasFullCard: boolean;
  onSolve: (puzzleId: PuzzleId) => void;
  onFail: (message: string) => void;
  onClose: () => void;
}

const COLOR_CYCLE: SpotlightColor[] = ['gold', 'cyan', 'rose'];

export const PuzzleModal: React.FC<PuzzleModalProps> = ({
  puzzleId,
  currentRoom,
  runConfig,
  powerRestored,
  hasFullCard,
  onSolve,
  onFail,
  onClose,
}) => {
  const [digits, setDigits] = useState('');
  const [bookSelection, setBookSelection] = useState<string[]>([]);
  const [foodSelection, setFoodSelection] = useState<string[]>([]);
  const [circuitSelection, setCircuitSelection] = useState<string[]>([]);
  const [spotColors, setSpotColors] = useState<[SpotlightColor, SpotlightColor, SpotlightColor]>([
    'gold',
    'gold',
    'gold',
  ]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!puzzleId) return null;

  const bookOrderText = runConfig.libraryOrder.map(getBookLabel).join(' → ');
  const circuitOrderText = runConfig.circuitOrder.map(getCircuitLabel).join(' → ');
  const canteenOrderText = runConfig.canteenOrder.map(getFoodLabel).join(' → ');
  const auditoriumTargetText = runConfig.auditoriumColors
    .map((c) => SPOTLIGHT_COLORS[c].label)
    .join(' · ');

  const handleKeypadDigit = (d: string, targetCode: string) => {
    setErrorMsg(null);
    if (digits.length < targetCode.length) {
      setDigits((prev) => prev + d);
    }
  };

  const handleSubmitCode = (targetCode: string) => {
    if (puzzleId === 'gate_code') {
      if (!powerRestored) {
        setErrorMsg('Power is out! Click the Power Fuse Box first to install your Fuse.');
        return;
      }
      if (!hasFullCard) {
        setErrorMsg('Full Gate Access Card required (found across Library + Canteen).');
        return;
      }
    }

    if (digits === targetCode) {
      setDigits('');
      setErrorMsg(null);
      onSolve(puzzleId);
    } else {
      setErrorMsg('Wrong code! Double-check the clue board in the room.');
      setDigits('');
      onFail('Incorrect keypad code made a loud beep!');
    }
  };

  const handlePickBook = (bookId: string) => {
    setErrorMsg(null);
    if (bookSelection.includes(bookId)) return;
    const next = [...bookSelection, bookId];
    const stepIdx = next.length - 1;
    if (next[stepIdx] !== runConfig.libraryOrder[stepIdx]) {
      setBookSelection([]);
      setErrorMsg(`Try again! Today's order is: ${bookOrderText}.`);
      onFail('A book slid back out slightly.');
      return;
    }
    setBookSelection(next);
    if (next.length === runConfig.libraryOrder.length) {
      setBookSelection([]);
      onSolve('library_books');
    }
  };

  const handlePickFood = (foodId: string) => {
    setErrorMsg(null);
    const next = [...foodSelection, foodId];
    const stepIdx = next.length - 1;
    if (next[stepIdx] !== runConfig.canteenOrder[stepIdx]) {
      setFoodSelection([]);
      setErrorMsg(`Wrong order! Menu says: ${canteenOrderText}.`);
      onFail('The kitchen locker buzzed softly!');
      return;
    }
    setFoodSelection(next);
    if (next.length === runConfig.canteenOrder.length) {
      setFoodSelection([]);
      onSolve('canteen_sequence');
    }
  };

  const handlePickCircuit = (nodeId: string) => {
    setErrorMsg(null);
    if (circuitSelection.includes(nodeId)) return;
    const next = [...circuitSelection, nodeId];
    const stepIdx = next.length - 1;
    if (next[stepIdx] !== runConfig.circuitOrder[stepIdx]) {
      setCircuitSelection([]);
      setErrorMsg(`Blueprint order for this game is: ${circuitOrderText}.`);
      onFail('Small spark on the drone board!');
      return;
    }
    setCircuitSelection(next);
    if (next.length === runConfig.circuitOrder.length) {
      setCircuitSelection([]);
      onSolve('robotics_circuit');
    }
  };

  const handleCycleSpotlight = (idx: 0 | 1 | 2) => {
    setErrorMsg(null);
    const next: [SpotlightColor, SpotlightColor, SpotlightColor] = [...spotColors];
    const currentIdx = COLOR_CYCLE.indexOf(next[idx]);
    next[idx] = COLOR_CYCLE[(currentIdx + 1) % COLOR_CYCLE.length];
    setSpotColors(next);

    if (
      next[0] === runConfig.auditoriumColors[0] &&
      next[1] === runConfig.auditoriumColors[1] &&
      next[2] === runConfig.auditoriumColors[2]
    ) {
      onSolve('auditorium_lights');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#060916]/80 p-4">
      <div className="w-full max-w-md bg-[#121a35] border-2 border-amber-400/80 rounded-2xl p-6 shadow-2xl flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-display text-2xl font-bold text-white">
              {puzzleId === 'classroom_code' && "Teacher's Desk Padlock"}
              {puzzleId === 'library_books' && 'Arrange the 3 Marked Books'}
              {puzzleId === 'robotics_circuit' && 'Wire the Mini Drone Circuit'}
              {puzzleId === 'canteen_sequence' && 'Midnight Menu Order Lock'}
              {puzzleId === 'auditorium_lights' && 'Stage Spotlight Colors'}
              {puzzleId === 'gate_code' && 'Main Gate Security Panel'}
              {puzzleId === 'torn_map_view' && 'Torn BMSIT Campus Map'}
            </h3>
            <p className="text-xs text-slate-300 mt-1">
              {puzzleId === 'classroom_code' &&
                'Enter the 3-digit code from the Blackboard / Folded Note.'}
              {puzzleId === 'library_books' && `Order for this run: ${bookOrderText}`}
              {puzzleId === 'robotics_circuit' && `Blueprint order: ${circuitOrderText}`}
              {puzzleId === 'canteen_sequence' && `Menu Combo: ${canteenOrderText}`}
              {puzzleId === 'auditorium_lights' &&
                `Tap each beam to match the Fest Poster: ${auditoriumTargetText}`}
              {puzzleId === 'gate_code' &&
                'Enter the 4-digit PIN shown on the Security Noticeboard.'}
              {puzzleId === 'torn_map_view' &&
                'Your 6-stage campus escape map for this run.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg cursor-pointer"
          >
            Close
          </button>
        </div>

        {/* Numeric Keypad Puzzles (Classroom 3-digit & Gate 4-digit) */}
        {(puzzleId === 'classroom_code' || puzzleId === 'gate_code') && (
          <div className="flex flex-col gap-3">
            {puzzleId === 'gate_code' && (
              <div className="grid grid-cols-2 gap-2 text-[11px] font-semibold text-center">
                <div
                  className={`py-1.5 px-2 rounded-lg border ${
                    powerRestored
                      ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                      : 'bg-red-500/15 border-red-400/60 text-red-300'
                  }`}
                >
                  {powerRestored ? 'Power: On' : 'Power: Install Fuse'}
                </div>
                <div
                  className={`py-1.5 px-2 rounded-lg border ${
                    hasFullCard
                      ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                      : 'bg-amber-500/15 border-amber-400/60 text-amber-200'
                  }`}
                >
                  {hasFullCard ? 'Access Card: Ready' : 'Need Full Card'}
                </div>
              </div>
            )}

            <div className="bg-[#090e1f] border border-slate-700 rounded-xl py-3 px-4 text-center font-mono-num text-3xl font-bold tracking-[0.4em] text-amber-300">
              {digits.padEnd(puzzleId === 'classroom_code' ? 3 : 4, '•')}
            </div>

            <div className="grid grid-cols-3 gap-2">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'Clear', '0', 'Go'].map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    if (key === 'Clear') {
                      setDigits('');
                      setErrorMsg(null);
                    } else if (key === 'Go') {
                      handleSubmitCode(
                        puzzleId === 'classroom_code' ? runConfig.classroomCode : runConfig.gateCode
                      );
                    } else {
                      handleKeypadDigit(
                        key,
                        puzzleId === 'classroom_code' ? runConfig.classroomCode : runConfig.gateCode
                      );
                    }
                  }}
                  className={`min-h-[48px] rounded-xl font-mono-num text-lg font-bold cursor-pointer transition-transform active:scale-95 ${
                    key === 'Go'
                      ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                      : key === 'Clear'
                        ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm'
                        : 'bg-[#1c274c] hover:bg-[#273566] text-white border border-slate-700'
                  }`}
                >
                  {key}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Stage 2: Library Book Ordering */}
        {puzzleId === 'library_books' && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between text-xs text-amber-300 font-semibold">
              <span>Selected: {bookSelection.length}/3</span>
              <button
                type="button"
                onClick={() => setBookSelection([])}
                className="underline text-slate-300 hover:text-white cursor-pointer"
              >
                Reset
              </button>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {BOOK_OPTIONS.map((b) => {
                const pickedIdx = bookSelection.indexOf(b.id);
                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => handlePickBook(b.id)}
                    className={`min-h-[48px] px-4 py-2.5 rounded-xl border text-left flex items-center justify-between cursor-pointer transition-colors ${
                      pickedIdx !== -1
                        ? 'bg-emerald-500/20 border-emerald-400 text-white'
                        : 'bg-[#1a2447] hover:bg-[#23315e] border-slate-700 text-slate-100'
                    }`}
                  >
                    <div>
                      <div className="font-semibold text-sm">{b.label}</div>
                      <div className="text-xs text-slate-300">{b.desc}</div>
                    </div>
                    <span
                      className="w-9 h-7 rounded-lg flex items-center justify-center font-mono-num font-bold text-xs text-white"
                      style={{ backgroundColor: b.color }}
                    >
                      {pickedIdx !== -1 ? `#${pickedIdx + 1}` : 'Pick'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Stage 3: Robotics Circuit Alignment */}
        {puzzleId === 'robotics_circuit' && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between text-xs text-cyan-300 font-semibold">
              <span>Wired Pins: {circuitSelection.length}/3</span>
              <button
                type="button"
                onClick={() => setCircuitSelection([])}
                className="underline text-slate-300 hover:text-white cursor-pointer"
              >
                Reset Wires
              </button>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {CIRCUIT_OPTIONS.map((node) => {
                const idx = circuitSelection.indexOf(node.id);
                return (
                  <button
                    key={node.id}
                    type="button"
                    onClick={() => handlePickCircuit(node.id)}
                    className={`min-h-[52px] px-4 py-2.5 rounded-xl border text-left flex items-center justify-between cursor-pointer transition-colors ${
                      idx !== -1
                        ? 'bg-emerald-500/20 border-emerald-400 text-white'
                        : 'bg-[#132542] hover:bg-[#1a345c] border-cyan-500/40 text-slate-100'
                    }`}
                  >
                    <div>
                      <div className="font-semibold text-sm">{node.label}</div>
                      <div className="text-xs text-slate-300">{node.sub}</div>
                    </div>
                    <span
                      className="px-2.5 py-1 rounded-lg font-mono-num font-bold text-xs text-slate-950"
                      style={{ backgroundColor: node.color }}
                    >
                      {idx !== -1 ? `#${idx + 1} Done` : 'Wire'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Stage 4: Canteen Sequence (3 Items) */}
        {puzzleId === 'canteen_sequence' && (
          <div className="flex flex-col gap-3">
            <div className="text-xs font-semibold text-amber-300">
              Combo Progress: {foodSelection.length}/{runConfig.canteenOrder.length}
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {FOOD_OPTIONS.map((fb) => (
                <button
                  key={fb.id}
                  type="button"
                  onClick={() => handlePickFood(fb.id)}
                  className="min-h-[56px] px-4 py-3 rounded-xl border border-slate-700 bg-[#1a2447] hover:bg-[#253363] text-white font-semibold text-sm flex items-center gap-2.5 cursor-pointer active:scale-95 transition-transform"
                >
                  <span
                    className="w-4 h-4 rounded-full shrink-0"
                    style={{ backgroundColor: fb.color }}
                  />
                  <span>{fb.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Stage 5: Auditorium Stage Spotlights (Simple Direct Color Match) */}
        {puzzleId === 'auditorium_lights' && (
          <div className="flex flex-col gap-3.5">
            <div className="bg-[#090e1f] border border-slate-700 rounded-xl p-2.5 text-center text-xs text-slate-200">
              Target Lineup: <strong className="text-amber-300">{auditoriumTargetText}</strong>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              {([0, 1, 2] as const).map((i) => {
                const curColor = spotColors[i];
                const meta = SPOTLIGHT_COLORS[curColor];
                const matched = curColor === runConfig.auditoriumColors[i];
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleCycleSpotlight(i)}
                    className={`min-h-[96px] rounded-xl p-3 border-2 flex flex-col items-center justify-center gap-2 cursor-pointer transition-transform active:scale-95 ${
                      matched
                        ? 'bg-emerald-500/15 border-emerald-400 text-white'
                        : 'bg-[#1a2447] hover:bg-[#243261] border-slate-600 text-slate-100'
                    }`}
                  >
                    <div
                      className="w-9 h-9 rounded-full border-2 border-slate-900 shadow-md"
                      style={{ backgroundColor: meta.hex }}
                    />
                    <div className="text-xs font-bold">Beam {i + 1}</div>
                    <div className="text-[11px] font-semibold text-slate-200">
                      {meta.label} {matched ? '✓' : ''}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Torn Campus Map (6 Stages) */}
        {puzzleId === 'torn_map_view' && (
          <div className="bg-[#fef3c7] text-slate-900 rounded-xl p-4 border-2 border-amber-700 flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-2.5 text-xs font-bold">
              {[
                { id: 'classroom', label: '1. Classroom Block', sub: `PIN ${runConfig.classroomCode} → Key` },
                { id: 'library', label: '2. Central Library', sub: 'Fuse + Card Frag A' },
                { id: 'robotics', label: '3. Robotics Lab', sub: '3D Gear + Mini Drone' },
                { id: 'canteen', label: '4. Midnight Canteen', sub: 'Tray + Chai + Frag B' },
                { id: 'auditorium', label: '5. Auditorium Stage', sub: 'Spotlights + Rope + Keys' },
                { id: 'gate', label: '6. Main Gate / Wall', sub: `PIN ${runConfig.gateCode} OR Rope!` },
              ].map((node) => (
                <div
                  key={node.id}
                  className={`p-2.5 rounded-lg border-2 ${
                    currentRoom === node.id
                      ? 'bg-amber-300 border-slate-900'
                      : 'bg-amber-100/80 border-amber-700/40'
                  }`}
                >
                  <div>{node.label}</div>
                  <div className="text-[11px] font-medium text-slate-700 mt-0.5">{node.sub}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="text-xs font-semibold text-red-300 bg-red-500/15 border border-red-400/50 rounded-lg px-3 py-2">
            {errorMsg}
          </div>
        )}
      </div>
    </div>
  );
};
