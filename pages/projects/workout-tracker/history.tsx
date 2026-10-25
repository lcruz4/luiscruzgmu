import { Clock } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { HistoryByDate } from '@/components/workout-tracker/HistoryByDate';
import { HistoryByExercise } from '@/components/workout-tracker/HistoryByExercise';
import { readLastOpenExerciseId } from '@/components/workout-tracker/lastOpenExercise';
import { LoadError } from '@/components/workout-tracker/LoadError';
import { cardClass } from '@/components/workout-tracker/styles';
import { useHistory } from '@/components/workout-tracker/useHistory';
import { WorkoutLayout } from '@/components/workout-tracker/WorkoutLayout';
import { cn } from '@/lib/utils';
import { requireLogin } from '@/services/auth';

type View = 'date' | 'exercise';

const VIEWS: { view: View; label: string }[] = [
  { view: 'date', label: 'By date' },
  { view: 'exercise', label: 'By exercise' },
];

const HistorySkeleton = () => (
  <main aria-busy className='flex flex-1 animate-pulse flex-col gap-4 p-4'>
    <span className='sr-only'>Loading history</span>
    <div aria-hidden className={`h-[180px] ${cardClass}`} />
    <div aria-hidden className={`h-[76px] ${cardClass}`} />
    <div aria-hidden className={`h-[76px] ${cardClass}`} />
  </main>
);

const EmptyHistory = () => (
  <main className='flex flex-1 flex-col items-center justify-center gap-6 px-6 py-8 text-center'>
    <div className='flex size-[72px] items-center justify-center rounded-full border-2 border-dashed border-mist-dashed text-mist-muted'>
      <Clock size={32} strokeWidth={2} aria-hidden />
    </div>
    <div className='flex flex-col gap-2'>
      <h2 className='m-0 text-[22px] leading-7 font-extrabold'>
        Nothing logged yet
      </h2>
      <p className='m-0 text-base leading-6 font-medium text-mist-muted'>
        Logged exercises show up here.
      </p>
    </div>
    <Link
      href='/projects/workout-tracker'
      className='text-sm font-bold text-mist-cyan-text'
    >
      Go to today’s workout
    </Link>
  </main>
);

const HistoryContent = ({ view }: { view: View }) => {
  const { data, isError } = useHistory();

  if (data?.length === 0) return <EmptyHistory />;
  if (data) {
    return view === 'date' ? (
      <HistoryByDate entries={data} />
    ) : (
      <HistoryByExercise entries={data} />
    );
  }
  if (isError) return <LoadError subject='history' />;
  return <HistorySkeleton />;
};

const HistoryPage = () => {
  const [view, setView] = useState<View>('date');

  useEffect(() => {
    if (readLastOpenExerciseId() !== undefined) setView('exercise');
  }, []);

  return (
    <WorkoutLayout>
      <header className='flex flex-col gap-3.5 border-b border-mist-line bg-mist-header px-4 pt-5 pb-4'>
        <h1 className='m-0 text-[26px] leading-8 font-extrabold'>History</h1>
        <div
          role='group'
          aria-label='History view'
          className='grid grid-cols-2 gap-1 rounded-[14px] border border-mist-line bg-mist-ground p-1'
        >
          {VIEWS.map(({ view: option, label }) => (
            <button
              key={option}
              type='button'
              aria-pressed={view === option}
              onClick={() => setView(option)}
              className={cn(
                'h-11 cursor-pointer rounded-[10px] text-[15px]',
                view === option
                  ? 'bg-mist-cyan font-extrabold text-mist-ink'
                  : 'font-bold text-mist-muted',
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </header>
      <HistoryContent view={view} />
    </WorkoutLayout>
  );
};

export const getServerSideProps = requireLogin;

export default HistoryPage;
