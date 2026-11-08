import { Check, Share2 } from 'lucide-react';
import { useState } from 'react';
import { dayTable } from '@/lib/workout/share';
import type { DayResponse } from '@/types/workout';
import { longDate, weekDayText } from './format';

// Copies the day as a table for Slack
export const ShareButton = ({ shown }: { shown: DayResponse }) => {
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);
  const { date, week, day, plan, exercises } = shown;

  const share = async () => {
    const heading = [
      longDate(date),
      weekDayText(week, day, plan.weeks),
      plan.dayTitles[day - 1],
    ]
      .filter(Boolean)
      .join(' · ');
    try {
      await navigator.clipboard.writeText(dayTable(heading, exercises));
      setFailed(false);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setFailed(true);
    }
  };

  return (
    <button
      type='button'
      onClick={share}
      aria-label={copied ? 'Copied' : 'Copy workout for Slack'}
      title={failed ? 'Copy failed' : undefined}
      className='inline-flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-[12px] border border-mist-line bg-mist-raised text-mist-text'
    >
      {copied ? (
        <Check size={18} strokeWidth={2.5} aria-hidden />
      ) : (
        <Share2
          size={18}
          strokeWidth={2.25}
          aria-hidden
          className={failed ? 'text-mist-pink-text' : undefined}
        />
      )}
    </button>
  );
};
