import { Check, Trophy } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { durationText } from './format';

export type CelebrationPhase = 'trophy' | 'summary';

const TROPHY_MS = 2500;
const SUMMARY_MS = 5000;

const CONFETTI_COLORS = [
  '--color-mist-cyan',
  '--color-mist-pink',
  '--color-mist-cyan-text',
  '--color-mist-warn-fill',
  '--color-mist-text',
];
const PIECES = 150;
const GRAVITY = 0.35;
const MAX_FALL = 4;
const CONFETTI_MS = 4000;

interface Piece {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  spin: number;
  flip: number;
  width: number;
  color: string;
}

// Burst from the bottom centre. Velocities are per 60fps frame and scaled by
// the elapsed time, so it runs at the same speed on 120Hz screens.
const Confetti = () => {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const width = innerWidth;
    const height = innerHeight;
    canvas.width = width * devicePixelRatio;
    canvas.height = height * devicePixelRatio;
    ctx.scale(devicePixelRatio, devicePixelRatio);

    const style = getComputedStyle(document.documentElement);
    const colors = CONFETTI_COLORS.map((name) => style.getPropertyValue(name));
    // Fast enough for the strongest pieces to reach the top
    const launch = Math.sqrt(2 * GRAVITY * height);
    const pieces: Piece[] = Array.from({ length: PIECES }, (_unused, i) => ({
      x: width / 2 + (Math.random() - 0.5) * 40,
      y: height,
      vx: (Math.random() - 0.5) * (width / 22),
      vy: -launch * (0.55 + Math.random() * 0.5),
      angle: Math.random() * Math.PI,
      spin: (Math.random() - 0.5) * 0.4,
      flip: Math.random() * Math.PI,
      width: 6 + Math.random() * 7,
      color: colors[i % colors.length],
    }));

    let frame = 0;
    const start = performance.now();
    let last = start;
    const draw = (now: number) => {
      const step = (now - last) / (1000 / 60);
      last = now;
      ctx.clearRect(0, 0, width, height);
      for (const piece of pieces) {
        piece.vy = Math.min(piece.vy + GRAVITY * step, MAX_FALL);
        piece.vx *= 0.99 ** step;
        piece.x += piece.vx * step;
        piece.y += piece.vy * step;
        piece.angle += piece.spin * step;
        piece.flip += 0.15 * step;
        ctx.save();
        ctx.translate(piece.x, piece.y);
        ctx.rotate(piece.angle);
        ctx.scale(1, Math.cos(piece.flip));
        ctx.fillStyle = piece.color;
        ctx.fillRect(-piece.width / 2, -3, piece.width, 6);
        ctx.restore();
      }
      if (now - start < CONFETTI_MS) frame = requestAnimationFrame(draw);
      else ctx.clearRect(0, 0, width, height);
    };
    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden
      className='pointer-events-none fixed inset-0 z-[60] size-full'
    />
  );
};

interface CelebrationProps {
  phase: CelebrationPhase;
  /** ms */
  duration: number;
  /** Hides the trophy */
  onNext: () => void;
  onClose: () => void;
}

// Confetti, a trophy and a summary toast. The trophy goes first; each ends on
// a tap or after a timeout.
export const Celebration = ({
  phase,
  duration,
  onNext,
  onClose,
}: CelebrationProps) => {
  useEffect(() => {
    const id = setTimeout(
      phase === 'trophy' ? onNext : onClose,
      phase === 'trophy' ? TROPHY_MS : SUMMARY_MS,
    );
    return () => clearTimeout(id);
  }, [phase]);

  return (
    <>
      <Confetti />
      {phase === 'trophy' && (
        <button
          type='button'
          aria-label='Workout complete'
          onClick={onNext}
          className='fixed inset-0 z-50 flex cursor-pointer items-center justify-center bg-mist-ink/20'
        >
          <span className='flex size-48 items-center justify-center rounded-full bg-mist-pink text-mist-surface shadow-lg motion-safe:animate-[celebrate-pop_0.5s_cubic-bezier(0.3,1.6,0.5,1)_both]'>
            <Trophy size={96} strokeWidth={2} aria-hidden />
          </span>
        </button>
      )}
      <button
        type='button'
        role='status'
        onClick={onClose}
        className='fixed inset-x-4 top-4 z-50 mx-auto flex max-w-[calc(28rem-2rem)] cursor-pointer items-center gap-3 rounded-2xl bg-mist-text px-4 py-3 text-left text-mist-surface shadow-lg motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-4'
      >
        <span className='flex size-9 shrink-0 items-center justify-center rounded-full bg-mist-cyan text-mist-ink'>
          <Check size={20} strokeWidth={3} aria-hidden />
        </span>
        <span className='flex flex-col'>
          <span className='text-base font-extrabold'>Workout complete</span>
          <span className='font-num text-sm text-mist-skeleton'>
            {durationText(duration)}
          </span>
        </span>
      </button>
    </>
  );
};
