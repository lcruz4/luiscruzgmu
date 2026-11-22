import { Lilita_One, UnifrakturMaguntia } from 'next/font/google';
import { useId } from 'react';
import { cn } from '@/lib/utils';
import { hoodMedalSvg } from './landingArt';

const fraktur = UnifrakturMaguntia({ subsets: ['latin'], weight: '400' });
const lilita = Lilita_One({ subsets: ['latin'], weight: '400' });

// Amber letters with the marker outline: a stroked copy behind (::before), a
// gloss copy on top (::after)
const Letters = ({ text }: { text: string }) => (
  <span
    data-t={text}
    className='relative inline-block whitespace-nowrap before:absolute before:inset-0 before:text-[#120d0b] before:content-[attr(data-t)] before:[-webkit-text-stroke:0.09em_#120d0b] before:[text-shadow:0_0.06em_0_#120d0b] after:pointer-events-none after:absolute after:inset-0 after:bg-[linear-gradient(rgba(255,255,255,.55),rgba(255,255,255,0)_40%)] after:bg-clip-text after:text-transparent after:content-[attr(data-t)]'
  >
    <span className='relative bg-[radial-gradient(90%_120%_at_38%_20%,#ffe7a8,#ffd27a_30%,#c98a1c_62%,#7a4a08)] bg-clip-text text-transparent'>
      {text}
    </span>
  </span>
);

// "Remorse" in fraktur with the hooded guilt medallion as the o. `hero` adds
// the CHESS tag underneath.
export const Wordmark = ({
  size,
  className,
}: {
  size: 'hero' | 'header';
  className?: string;
}) => {
  const id = `w${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  return (
    <span
      role='img'
      aria-label='Remorse Chess'
      className={cn(
        'inline-flex -rotate-2 flex-col items-center',
        // after the size: tailwind-merge drops a leading set before it
        size === 'hero' ? 'text-[clamp(60px,9vw,84px)]' : 'text-[27px]',
        'leading-none',
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(fraktur.className, 'inline-flex items-center')}
      >
        <Letters text='Rem' />
        <span
          className='mx-[.02em] mt-[.22em] block size-[.62em] flex-none'
          dangerouslySetInnerHTML={{ __html: hoodMedalSvg(id) }}
        />
        <Letters text='rse' />
      </span>
      {size === 'hero' && (
        <span
          aria-hidden
          className={cn(
            lilita.className,
            'relative mt-0.5 rotate-[1.5deg] rounded-lg border-[3px] border-[#120d0b] bg-[#4b3322] py-0.5 pr-2.5 pl-[calc(10px+.3em)] text-lg tracking-[.3em] text-[#e6c48e] shadow-[0_3px_0_#120d0b]',
          )}
        >
          CHESS
        </span>
      )}
    </span>
  );
};
