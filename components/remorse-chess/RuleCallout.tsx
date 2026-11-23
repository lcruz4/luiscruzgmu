import { useCallback, useRef, useState } from 'react';
import { type RuleKey, ruleOf } from '@/lib/remorse/tutorial';
import type { GameStep, Trauma } from '@/types/remorse';
import { RuleIcon } from './RuleIcon';
import { BLOODLUST_ITEMS, FATES, HEAL_ITEMS } from './rulesContent';

// Rules that came up in steps the board just finished animating. Pass
// `onAnimating` on to the board; steps on the page's first load don't count.
export const useNewRules = (steps: GameStep[] | undefined) => {
  const stepsRef = useRef(steps);
  stepsRef.current = steps;
  const from = useRef<number | null>(null);
  const [found, setFound] = useState<RuleKey[]>([]);

  const onAnimating = useCallback((start: number | null) => {
    if (start !== null) {
      from.current ??= start;
      return;
    }
    const begin = from.current;
    from.current = null;
    if (begin === null || !stepsRef.current) return;
    const keys: RuleKey[] = [];
    for (const step of stepsRef.current.slice(begin)) {
      for (const event of step.events) {
        const key = ruleOf(event);
        if (key) keys.push(key);
      }
    }
    if (keys.length) setFound((prev) => [...new Set([...prev, ...keys])]);
  }, []);

  return { found, onAnimating };
};

const fateNote = (trauma: Trauma): Note => {
  const fate = FATES.find(({ key }) => key === trauma);
  if (!fate) throw new Error(`No rule text for ${trauma}`);
  return { title: fate.name, text: fate.text };
};

interface Note {
  title: string;
  text: string;
}

const CONTENT: Record<RuleKey, Note> = {
  devastated: fateNote('devastated'),
  guilt: fateNote('guilt'),
  unaffected: fateNote('unaffected'),
  psychopath: fateNote('psychopath'),
  heal: { title: 'Bishops heal', text: HEAL_ITEMS[0] },
  bloodlust: {
    title: 'Bloodlust',
    text: BLOODLUST_ITEMS[0],
  },
};

// A one-time note the first time a rule comes up in play
export const RuleCallout = ({
  rule,
  onDismiss,
  onMore,
}: {
  rule: RuleKey;
  onDismiss: () => void;
  onMore: () => void;
}) => {
  const { title, text } = CONTENT[rule];
  return (
    <div
      role='status'
      className='my-2 flex items-start gap-3 rounded-xl border border-[#c98a1c]/45 bg-[#2b2418] p-3 motion-safe:animate-in motion-safe:fade-in-0'
    >
      <RuleIcon rule={rule} className='block h-12 w-11 flex-none' />
      <div className='min-w-0 flex-1'>
        <strong className='block text-[15px] text-[#ffd27a]'>
          New rule: {title}
        </strong>
        <p className='text-[13.5px] leading-snug text-[#c9c4bb]'>{text}</p>
        <div className='mt-2 flex gap-3 text-sm font-semibold'>
          <button
            type='button'
            className='cursor-pointer text-white hover:underline'
            onClick={onDismiss}
          >
            Got it
          </button>
          <button
            type='button'
            className='cursor-pointer text-[#a29e96] hover:text-white hover:underline'
            onClick={onMore}
          >
            More about this
          </button>
        </div>
      </div>
    </div>
  );
};
