import { useEffect, useMemo, useRef, useState } from 'react';
import { timeControlOf } from '@/lib/remorse/timeControls';
import { cn } from '@/lib/utils';
import type { Color, GameResponse } from '@/types/remorse';

export interface SideClock {
  ms: number;
  running: boolean;
  daily: boolean;
  // the side hasn't moved yet: time until the game is aborted
  firstMoveMs: number | null;
}

const pad = (n: number) => String(n).padStart(2, '0');

// Live: m:ss, with tenths under 20 seconds. Daily: the largest unit left.
export const formatClock = (ms: number, daily: boolean) => {
  if (daily) {
    const hours = ms / 3_600_000;
    if (hours >= 48) return `${Math.floor(hours / 24)} days`;
    if (hours >= 1) return `${Math.floor(hours)} h`;
    return `${Math.max(0, Math.ceil(ms / 60_000))} min`;
  }
  if (ms < 20_000) {
    const tenths = Math.max(0, Math.floor(ms / 100));
    return `0:${pad(Math.floor(tenths / 10))}.${tenths % 10}`;
  }
  const seconds = Math.ceil(ms / 1000);
  return `${Math.floor(seconds / 60)}:${pad(seconds % 60)}`;
};

// Each side's clock, counting down the side to move's from when this copy of
// the game arrived. onFlag: once per copy, when the running clock or the
// first-move window hits zero; the server checks and ends or aborts the game.
export const useClocks = (
  game: GameResponse | undefined,
  onFlag: () => void,
): Record<Color, SideClock | null> => {
  const receivedAt = useMemo(() => (game ? Date.now() : 0), [game]);
  const clock = game?.clock ?? null;
  const ticking = clock?.runningMs !== null && clock !== null;
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!ticking) return;
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(timer);
  }, [ticking, receivedAt]);

  const flagged = useRef<GameResponse | null>(null);
  const left = (ms: number | null | undefined) =>
    ms === null || ms === undefined
      ? null
      : Math.max(0, ms - (now - receivedAt));
  const running = left(clock?.runningMs);
  const firstMove = left(clock?.firstMoveMs);
  const out = Boolean(
    game && !game.state.winner && (running === 0 || firstMove === 0),
  );
  useEffect(() => {
    if (!out || !game || flagged.current === game) return;
    flagged.current = game;
    onFlag();
  }, [out, game, onFlag]);

  if (!game || !clock) return { w: null, b: null };
  const daily = timeControlOf(game.timeControl)?.category === 'daily';
  const side = (color: Color): SideClock | null => {
    const toMove = !game.state.winner && game.state.turn === color;
    if (toMove && running !== null) {
      return { ms: running, running: true, daily, firstMoveMs: firstMove };
    }
    const ms = color === 'w' ? clock.whiteMs : clock.blackMs;
    return ms === null
      ? null
      : { ms, running: false, daily, firstMoveMs: null };
  };
  return { w: side('w'), b: side('b') };
};

export const ClockFace = ({ clock }: { clock: SideClock }) => (
  <span
    className={cn(
      'flex-none rounded-lg px-2.5 py-1 font-semibold tabular-nums',
      clock.daily ? 'text-sm' : 'min-w-[76px] text-right text-lg',
      clock.running
        ? !clock.daily && clock.ms < 10_000
          ? 'bg-red-700 text-white'
          : 'bg-[#f7f3ea] text-[#120d0b]'
        : 'bg-[#302d29] text-[#a29e96]',
    )}
    aria-label={clock.running ? 'Time left to move' : 'Time left'}
  >
    {formatClock(clock.ms, clock.daily)}
  </span>
);
