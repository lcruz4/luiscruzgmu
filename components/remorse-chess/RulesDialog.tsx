import { type ReactNode, useId } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { type TutorialKey, TUTORIAL_KEYS } from '@/lib/remorse/tutorial';
import { cn } from '@/lib/utils';
import { buttonMd, ghostButton, goldButton } from './buttons';
import { Dice } from './Dice';
import { healSvg } from './landingArt';
import { Marker } from './Marker';
import {
  BLOODLUST_ITEMS,
  BLOODLUST_MARKER,
  FATES,
  HEAL_ITEMS,
} from './rulesContent';

interface Slide {
  title: string;
  art: ReactNode;
  body: ReactNode;
}

const List = ({ items }: { items: string[] }) => (
  <ul className='flex list-disc flex-col gap-1.5 pl-[18px]'>
    {items.map((item) => (
      <li key={item}>{item}</li>
    ))}
  </ul>
);

const useSlides = (): Record<TutorialKey, Slide> => {
  const id = `r${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const fates = Object.fromEntries(
    FATES.map(({ key, marker, roll, name, text }) => [
      key,
      {
        title: name,
        art: (
          <div className='flex flex-col items-center gap-1.5'>
            <Marker {...marker} className='block h-[78px] w-[72px]' />
            <Dice roll={roll} />
            <span className='text-xs text-[#a29e96] tabular-nums'>
              {roll.length} in 6
            </span>
          </div>
        ),
        body: <p>{text}</p>,
      },
    ]),
  );
  return {
    intro: {
      title: 'Live with what you capture',
      art: (
        <div className='grid grid-cols-2 gap-1'>
          {FATES.map(({ key, marker }) => (
            <Marker key={key} {...marker} className='block h-11 w-10' />
          ))}
        </div>
      ),
      body: (
        <>
          <p>
            Normal chess until a piece makes its first capture. Then a d6
            decides how that piece copes, for the rest of the game.
          </p>
          <p className='mt-2'>
            Its marker shows up on the piece. Here&apos;s what each one means.
          </p>
        </>
      ),
    },
    devastated: fates.devastated,
    guilt: fates.guilt,
    unaffected: fates.unaffected,
    psychopath: fates.psychopath,
    heal: {
      title: 'Bishops heal',
      art: (
        <span
          className='block size-[72px]'
          dangerouslySetInnerHTML={{ __html: healSvg(id) }}
        />
      ),
      body: <List items={HEAL_ITEMS} />,
    },
    bloodlust: {
      title: 'Bloodlust',
      art: <Marker {...BLOODLUST_MARKER} className='block h-[78px] w-[74px]' />,
      body: <List items={BLOODLUST_ITEMS} />,
    },
  };
};

const primary = cn(goldButton, buttonMd);
const ghost = cn(ghostButton, buttonMd);

// The rules one slide at a time; `slide` is controlled so a callout can open
// it on its own rule
export const RulesDialog = ({
  slide,
  onSlide,
  onClose,
}: {
  slide: TutorialKey | null;
  onSlide: (slide: TutorialKey) => void;
  onClose: () => void;
}) => {
  const slides = useSlides();
  const index = slide ? TUTORIAL_KEYS.indexOf(slide) : 0;
  const current = slides[TUTORIAL_KEYS[index]];
  const last = index === TUTORIAL_KEYS.length - 1;

  return (
    <Dialog open={slide !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className='max-w-[calc(100%-32px)] gap-0 rounded-2xl border-[#3a3733] bg-[#262421] p-5 font-sans text-[#e8e6e1] sm:max-w-md sm:rounded-2xl [&>button]:text-[#a29e96]'>
        <p className='text-xs font-semibold tracking-wide text-[#c98a1c] uppercase'>
          How Remorse Chess works
        </p>
        <div className='mt-3 flex min-h-[190px] items-start gap-4'>
          <div className='flex w-[84px] flex-none justify-center'>
            {current.art}
          </div>
          <div className='min-w-0'>
            <DialogTitle className='mb-1.5 text-lg font-bold text-white'>
              {current.title}
            </DialogTitle>
            <DialogDescription asChild>
              <div className='text-[14px] leading-snug text-[#a29e96]'>
                {current.body}
              </div>
            </DialogDescription>
          </div>
        </div>
        {last && (
          <p className='mt-2 text-[13px] text-[#a29e96]'>
            Everything else is regular chess: castling, en passant, promotion,
            check, checkmate and stalemate.
          </p>
        )}
        <div className='mt-4 flex items-center justify-between gap-3'>
          <div className='flex gap-1.5'>
            {TUTORIAL_KEYS.map((key, i) => (
              <button
                key={key}
                type='button'
                aria-label={`Show ${slides[key].title}`}
                onClick={() => onSlide(key)}
                className={cn(
                  'size-2 cursor-pointer rounded-full',
                  i === index ? 'bg-[#ffd27a]' : 'bg-[#514d47]',
                )}
              />
            ))}
          </div>
          <div className='flex gap-2'>
            <button
              type='button'
              className={ghost}
              disabled={index === 0}
              onClick={() => onSlide(TUTORIAL_KEYS[index - 1])}
            >
              Back
            </button>
            <button
              type='button'
              className={primary}
              onClick={() =>
                last ? onClose() : onSlide(TUTORIAL_KEYS[index + 1])
              }
            >
              {last ? 'Play' : 'Next'}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
