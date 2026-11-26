import { ChevronDown, ChevronUp, Lock, LockOpen } from 'lucide-react';
import { useEffect, useId, useRef } from 'react';
import {
  roundPercents,
  TRAUMAS,
  type TraumaPercents,
} from '@/lib/remorse/balance';
import { cn } from '@/lib/utils';
import type { Trauma } from '@/types/remorse';

// One side's first-capture odds as potion vials on a painted wooden rack.
// Drag a vial or use its chevrons; the unlocked vials make room.

const OUT = '#120d0b';

const VIALS: Record<
  Trauma,
  { name: string; base: string; dark: string; light: string }
> = {
  devastated: {
    name: 'Devastated',
    base: '#2c63c9',
    dark: '#163773',
    light: '#7da6ee',
  },
  guilt: { name: 'Guilt', base: '#c98a1c', dark: '#74490a', light: '#ffd27a' },
  unaffected: {
    name: 'Unaffected',
    base: '#64717e',
    dark: '#323a43',
    light: '#a3aeb9',
  },
  psychopath: {
    name: 'Psychopath',
    base: '#c62828',
    dark: '#6a0f0f',
    light: '#ef7070',
  },
};

const W = 300;
const H = 262;
const XS = [44, 114, 184, 254];
const HALF = 13;
const TOP = 50;
const BOTTOM = 202;
const FULL = 58;
const levelOf = (percent: number) => BOTTOM - ((BOTTOM - FULL) * percent) / 100;
const tube = (cx: number) =>
  `M${cx - HALF} ${TOP} V${BOTTOM - HALF} A${HALF} ${HALF} 0 0 0 ${cx + HALF} ${
    BOTTOM - HALF
  } V${TOP} Z`;
const at = (x: number, y: number) => ({
  left: `${(x / W) * 100}%`,
  top: `${(y / H) * 100}%`,
});

// Fires once on press, then repeats while held
const useRepeat = () => {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stop = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };
  useEffect(() => stop, []);
  return (run: () => void) => ({
    onPointerDown: (event: React.PointerEvent) => {
      if (event.button !== 0) return;
      run();
      const tick = (delay: number) => {
        timer.current = setTimeout(() => {
          run();
          tick(60);
        }, delay);
      };
      tick(380);
    },
    onPointerUp: stop,
    onPointerLeave: stop,
    onPointerCancel: stop,
    onKeyDown: (event: React.KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        run();
      }
    },
  });
};

const Wood = ({ id }: { id: string }) => (
  <defs>
    <filter id={`${id}grain`} x='0' y='0' width='100%' height='100%'>
      <feTurbulence
        type='fractalNoise'
        baseFrequency='0.006 0.11'
        numOctaves='4'
        seed='7'
      />
      <feColorMatrix values='0 0 0 0 0.09  0 0 0 0 0.045  0 0 0 0 0.015  0 0 0 1.5 -0.55' />
      <feComposite in2='SourceGraphic' operator='in' result='grain' />
      <feMerge>
        <feMergeNode in='SourceGraphic' />
        <feMergeNode in='grain' />
      </feMerge>
    </filter>
    <filter id={`${id}rough`}>
      <feTurbulence type='fractalNoise' baseFrequency='0.05' numOctaves='2' />
      <feDisplacementMap in='SourceGraphic' scale='1.8' />
    </filter>
    <filter id={`${id}soft`} x='-30%' y='-30%' width='160%' height='160%'>
      <feGaussianBlur stdDeviation='3' />
    </filter>
    <filter id={`${id}cork`} x='0' y='0' width='100%' height='100%'>
      <feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' />
      <feColorMatrix values='0 0 0 0 0.2  0 0 0 0 0.12  0 0 0 0 0.05  0 0 0 2 -0.9' />
      <feComposite in2='SourceGraphic' operator='in' result='dots' />
      <feMerge>
        <feMergeNode in='SourceGraphic' />
        <feMergeNode in='dots' />
      </feMerge>
    </filter>
    <linearGradient id={`${id}board`} x1='0' x2='1'>
      <stop offset='0' stopColor='#24150b' />
      <stop offset='0.18' stopColor='#3a2414' />
      <stop offset='0.55' stopColor='#432a17' />
      <stop offset='0.85' stopColor='#36210f' />
      <stop offset='1' stopColor='#21130a' />
    </linearGradient>
    <linearGradient id={`${id}plank`} x1='0' y1='0' x2='0' y2='1'>
      <stop offset='0' stopColor='#8c5e36' />
      <stop offset='0.35' stopColor='#6b4425' />
      <stop offset='1' stopColor='#432914' />
    </linearGradient>
    <radialGradient id={`${id}brass`} cx='35%' cy='30%' r='70%'>
      <stop offset='0' stopColor='#fff0b8' />
      <stop offset='0.45' stopColor='#d9a23a' />
      <stop offset='1' stopColor='#6e4710' />
    </radialGradient>
    <linearGradient id={`${id}plate`} x1='0' y1='0' x2='0' y2='1'>
      <stop offset='0' stopColor='#f3cf7a' />
      <stop offset='0.5' stopColor='#c08a2a' />
      <stop offset='1' stopColor='#7c5314' />
    </linearGradient>
    <linearGradient id={`${id}corkfill`} x1='0' y1='0' x2='1' y2='0'>
      <stop offset='0' stopColor='#7a5534' />
      <stop offset='0.4' stopColor='#c39463' />
      <stop offset='1' stopColor='#6e4a2a' />
    </linearGradient>
    <linearGradient id={`${id}glass`} x1='0' x2='1'>
      <stop offset='0' stopColor='#0d0805' stopOpacity='0.85' />
      <stop offset='0.5' stopColor='#1d1510' stopOpacity='0.6' />
      <stop offset='1' stopColor='#0d0805' stopOpacity='0.85' />
    </linearGradient>
    {TRAUMAS.map((trauma) => (
      <linearGradient key={trauma} id={`${id}${trauma}`} x1='0' x2='1'>
        <stop offset='0' stopColor={VIALS[trauma].dark} />
        <stop offset='0.42' stopColor={VIALS[trauma].base} />
        <stop offset='0.62' stopColor={VIALS[trauma].light} />
        <stop offset='1' stopColor={VIALS[trauma].dark} />
      </linearGradient>
    ))}
  </defs>
);

// The board behind the vials: grained planks, a knot, brass screws
const Backboard = ({ id }: { id: string }) => (
  <>
    <rect
      x='4'
      y='4'
      width={W - 8}
      height={H - 8}
      rx='14'
      fill={`url(#${id}board)`}
      filter={`url(#${id}grain)`}
    />
    {[78, 152, 226].map((x) => (
      <path
        key={x}
        d={`M${x} 10 C${x + 1.5} 80 ${x - 1.5} 160 ${x} ${H - 10}`}
        stroke='#160c05'
        strokeOpacity='0.55'
        strokeWidth='1.6'
        fill='none'
        filter={`url(#${id}rough)`}
      />
    ))}
    <g opacity='0.55' filter={`url(#${id}rough)`}>
      <ellipse cx='204' cy='146' rx='7' ry='4' fill='#1b0f07' />
      {[11, 16, 22].map((r) => (
        <ellipse
          key={r}
          cx='204'
          cy='146'
          rx={r}
          ry={r * 0.45}
          fill='none'
          stroke='#1b0f07'
          strokeWidth='1.1'
        />
      ))}
    </g>
    <path
      d={`M18 12 Q${W / 2} 8 ${W - 18} 12`}
      stroke='#a77345'
      strokeOpacity='0.35'
      strokeWidth='3'
      strokeLinecap='round'
      fill='none'
      filter={`url(#${id}rough)`}
    />
    <rect
      x='4'
      y='4'
      width={W - 8}
      height={H - 8}
      rx='14'
      fill='none'
      stroke={OUT}
      strokeWidth='3.5'
      filter={`url(#${id}rough)`}
    />
    {[
      [18, 18],
      [W - 18, 18],
    ].map(([cx, cy]) => (
      <g key={cx}>
        <circle
          cx={cx}
          cy={cy}
          r='5'
          fill={`url(#${id}brass)`}
          stroke={OUT}
          strokeWidth='1.4'
        />
        <path
          d={`M${cx - 3} ${cy + 1.5}l6 -3`}
          stroke='#4a2f0a'
          strokeWidth='1.3'
        />
      </g>
    ))}
  </>
);

// The rail the vials hang through: its top sits behind them, its front face
// in front, so they read as dropped through holes
const RailBack = ({ id }: { id: string }) => (
  <>
    <rect
      x='10'
      y='90'
      width={W - 20}
      height='10'
      rx='3'
      fill='#000'
      opacity='0.45'
      filter={`url(#${id}soft)`}
    />
    <rect
      x='12'
      y='82'
      width={W - 24}
      height='9'
      rx='3'
      fill='#7a522f'
      stroke={OUT}
      strokeWidth='2.2'
    />
    {XS.map((cx) => (
      <ellipse key={cx} cx={cx} cy='87' rx={HALF + 4} ry='3.6' fill='#140a04' />
    ))}
  </>
);

const RailFront = ({ id }: { id: string }) => (
  <>
    <rect
      x='12'
      y='88'
      width={W - 24}
      height='11'
      rx='2.5'
      fill={`url(#${id}plank)`}
      stroke={OUT}
      strokeWidth='2.4'
      filter={`url(#${id}rough)`}
    />
    <path
      d={`M18 90.5 H${W - 18}`}
      stroke='#c08a58'
      strokeOpacity='0.45'
      strokeWidth='1.4'
      strokeLinecap='round'
    />
  </>
);

const Shelf = ({ id }: { id: string }) => (
  <>
    <rect
      x='14'
      y={BOTTOM + 6}
      width={W - 28}
      height='14'
      fill='#000'
      opacity='0.5'
      filter={`url(#${id}soft)`}
    />
    <path
      d={`M10 ${BOTTOM} H${W - 10} L${W - 6} ${BOTTOM + 7} H6 Z`}
      fill='#8a5c34'
      stroke={OUT}
      strokeWidth='2.2'
      strokeLinejoin='round'
    />
    <rect
      x='6'
      y={BOTTOM + 7}
      width={W - 12}
      height='24'
      rx='3'
      fill={`url(#${id}plank)`}
      stroke={OUT}
      strokeWidth='2.6'
      filter={`url(#${id}rough)`}
    />
    <path
      d={`M12 ${BOTTOM + 10} H${W - 12}`}
      stroke='#c08a58'
      strokeOpacity='0.4'
      strokeWidth='1.5'
      strokeLinecap='round'
    />
    <path
      d={`M30 ${BOTTOM + 24} q60 -3 120 0 t110 1`}
      stroke='#2a170a'
      strokeOpacity='0.5'
      strokeWidth='1.2'
      fill='none'
    />
  </>
);

const Vial = ({
  id,
  cx,
  trauma,
  percent,
  locked,
}: {
  id: string;
  cx: number;
  trauma: Trauma;
  percent: number;
  locked: boolean;
}) => {
  const vial = VIALS[trauma];
  const level = levelOf(percent);
  const clip = `${id}clip${trauma}`;
  return (
    <g>
      <clipPath id={clip}>
        <path d={tube(cx)} />
      </clipPath>
      <ellipse
        cx={cx + 6}
        cy={BOTTOM - 2}
        rx={HALF + 4}
        ry='4'
        fill='#000'
        opacity='0.55'
        filter={`url(#${id}soft)`}
      />
      <path d={tube(cx)} fill={`url(#${id}glass)`} />
      <g clipPath={`url(#${clip})`}>
        <rect
          x={cx - HALF}
          y={level}
          width={HALF * 2}
          height={BOTTOM - level + 2}
          fill={`url(#${id}${trauma})`}
          className='transition-[y,height] duration-150 ease-out'
        />
        {percent > 0 && (
          <ellipse
            cx={cx}
            cy={level}
            rx={HALF}
            ry='2.6'
            fill={vial.light}
            opacity='0.9'
            className='transition-[cy] duration-150 ease-out'
          />
        )}
        {percent > 6 &&
          [
            [-4, 0, 1.8],
            [3, 1.3, 1.2],
            [-1, 2.1, 1.5],
          ].map(([dx, delay, r]) => (
            <circle
              key={delay}
              cx={cx + dx}
              cy={BOTTOM - 6}
              r={r}
              fill={vial.light}
              opacity='0.7'
              className='animate-[vial-bubble_2.8s_linear_infinite]'
              style={{ animationDelay: `-${delay}s` }}
            />
          ))}
        <rect
          x={cx - HALF + 3}
          y={TOP + 4}
          width='3.5'
          height={BOTTOM - TOP - 20}
          rx='1.75'
          fill='#fff'
          opacity='0.3'
        />
        <rect
          x={cx + HALF - 5}
          y={TOP + 10}
          width='1.6'
          height={BOTTOM - TOP - 40}
          rx='0.8'
          fill='#fff'
          opacity='0.16'
        />
      </g>
      {[0.25, 0.5, 0.75].map((f) => (
        <path
          key={f}
          d={`M${cx + HALF - 6} ${levelOf(f * 100)} h6`}
          stroke='#f7f3ea'
          strokeOpacity='0.45'
          strokeWidth='1.2'
        />
      ))}
      <path d={tube(cx)} fill='none' stroke={OUT} strokeWidth='2.8' />
      <path
        d={tube(cx)}
        fill='none'
        stroke={locked ? '#ffd27a' : '#f7f3ea'}
        strokeOpacity={locked ? 0.9 : 0.14}
        strokeWidth='1'
        transform='translate(0.6 0.6)'
      />
      <rect
        x={cx - HALF - 2}
        y={TOP - 3}
        width={HALF * 2 + 4}
        height='5'
        rx='2'
        fill='#b8b0a0'
        stroke={OUT}
        strokeWidth='1.8'
      />
      <path
        d={`M${cx - HALF + 1} ${TOP - 16} h${HALF * 2 - 2} l-1.5 14 h${-(
          HALF * 2 -
          5
        )} z`}
        fill={`url(#${id}corkfill)`}
        stroke={OUT}
        strokeWidth='2'
        strokeLinejoin='round'
        filter={`url(#${id}cork)`}
      />
    </g>
  );
};

export const VialRack = ({
  percents,
  locked,
  onAdjust,
  onToggleLock,
}: {
  percents: TraumaPercents;
  locked: Trauma[];
  // to: the new value from the current one
  onAdjust: (trauma: Trauma, to: (current: number) => number) => void;
  onToggleLock: (trauma: Trauma) => void;
}) => {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const svgRef = useRef<SVGSVGElement>(null);
  const repeat = useRepeat();
  const shown = roundPercents(percents);
  const unlockedOthers = (trauma: Trauma) =>
    TRAUMAS.some((other) => other !== trauma && !locked.includes(other));

  const dragTo = (trauma: Trauma, event: React.PointerEvent) => {
    const svg = svgRef.current;
    if (!svg) return;
    const box = svg.getBoundingClientRect();
    const y = ((event.clientY - box.top) / box.height) * H;
    onAdjust(trauma, () => ((BOTTOM - y) / (BOTTOM - FULL)) * 100);
  };

  return (
    <div className='relative aspect-[300/262] w-full select-none'>
      <style>{`@keyframes vial-bubble{0%{transform:translateY(0);opacity:0}15%{opacity:.7}100%{transform:translateY(-70px);opacity:0}}`}</style>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className='absolute inset-0 block size-full'
        aria-hidden='true'
      >
        <Wood id={id} />
        <Backboard id={id} />
        <RailBack id={id} />
        {TRAUMAS.map((trauma, i) => (
          <Vial
            key={trauma}
            id={id}
            cx={XS[i]}
            trauma={trauma}
            percent={percents[trauma]}
            locked={locked.includes(trauma)}
          />
        ))}
        <RailFront id={id} />
        <Shelf id={id} />
        {TRAUMAS.map((trauma, i) => (
          <g key={trauma}>
            <rect
              x={XS[i] - 18}
              y={BOTTOM + 11}
              width='36'
              height='16'
              rx='3'
              fill={`url(#${id}plate)`}
              stroke={OUT}
              strokeWidth='1.6'
            />
            <text
              x={XS[i]}
              y={BOTTOM + 23.5}
              textAnchor='middle'
              fontSize='11.5'
              fontWeight='700'
              fill='#2a1a06'
              className='tabular-nums'
            >
              {shown[trauma]}%
            </text>
            <text
              x={XS[i]}
              y={H - 13}
              textAnchor='middle'
              fontSize='10'
              fontWeight='600'
              fill={VIALS[trauma].light}
            >
              {VIALS[trauma].name}
            </text>
          </g>
        ))}
        {TRAUMAS.map((trauma, i) =>
          locked.includes(trauma) || !unlockedOthers(trauma) ? null : (
            <rect
              key={trauma}
              x={XS[i] - HALF - 4}
              y={TOP - 16}
              width={HALF * 2 + 8}
              height={BOTTOM - TOP + 16}
              fill='transparent'
              className='cursor-ns-resize'
              style={{ touchAction: 'none' }}
              onPointerDown={(event) => {
                event.currentTarget.setPointerCapture(event.pointerId);
                dragTo(trauma, event);
              }}
              onPointerMove={(event) => {
                if (event.currentTarget.hasPointerCapture(event.pointerId)) {
                  dragTo(trauma, event);
                }
              }}
            />
          ),
        )}
      </svg>
      {TRAUMAS.map((trauma, i) => {
        const isLocked = locked.includes(trauma);
        const movable = !isLocked && unlockedOthers(trauma);
        const name = VIALS[trauma].name;
        return (
          <div key={trauma}>
            <button
              type='button'
              aria-pressed={isLocked}
              aria-label={`${isLocked ? 'Unlock' : 'Lock'} ${name}`}
              title={
                isLocked ? `Unlock ${name}` : `Lock ${name} so it stays put`
              }
              onClick={() => onToggleLock(trauma)}
              style={at(XS[i], 8)}
              className={cn(
                'absolute flex size-[7.5%] min-h-6 min-w-6 -translate-x-1/2 cursor-pointer items-center justify-center rounded-full border-2 border-[#120d0b] transition-colors',
                isLocked
                  ? 'bg-[#c98a1c] text-[#1a1209]'
                  : 'bg-[#3d2717] text-[#d8c3a5] hover:bg-[#5a3a22]',
              )}
            >
              {isLocked ? (
                <Lock className='size-3.5' strokeWidth={2.6} />
              ) : (
                <LockOpen className='size-3.5' strokeWidth={2.4} />
              )}
            </button>
            {movable &&
              (
                [
                  [1, 108, ChevronUp, 'More'],
                  [-1, 146, ChevronDown, 'Less'],
                ] as const
              ).map(([step, y, Icon, word]) => (
                <button
                  key={step}
                  type='button'
                  aria-label={`${word} ${name}`}
                  {...repeat(() =>
                    onAdjust(trauma, (current) => current + step),
                  )}
                  style={at(XS[i] + HALF + 12, y)}
                  className='absolute flex h-[11%] w-[8%] min-w-6 -translate-x-1/2 cursor-pointer touch-none items-center justify-center rounded-md border-2 border-[#120d0b] bg-[#5a3a22] text-[#f7f3ea] shadow-[inset_0_1px_0_rgba(255,220,170,.3),0_2px_0_#120d0b] hover:bg-[#7a522f] active:translate-y-px'
                >
                  <Icon className='size-4' strokeWidth={3} />
                </button>
              ))}
          </div>
        );
      })}
    </div>
  );
};
