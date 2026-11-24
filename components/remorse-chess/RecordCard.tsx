import { cn } from '@/lib/utils';
import type { PlayerStats, Trauma } from '@/types/remorse';
import { Marker } from './Marker';

const FATES: { trauma: Trauma; name: string; odds: number; bar: string }[] = [
  { trauma: 'devastated', name: 'Devastated', odds: 1 / 6, bar: '#2c63c9' },
  { trauma: 'guilt', name: 'Guilt-ridden', odds: 2 / 6, bar: '#c98a1c' },
  { trauma: 'unaffected', name: 'Unaffected', odds: 2 / 6, bar: '#64717e' },
  { trauma: 'psychopath', name: 'Psychopath', odds: 1 / 6, bar: '#c62828' },
];

const pct = (n: number) => `${Math.round(n * 100)}%`;

const Tally = ({
  value,
  label,
  gold,
}: {
  value: number;
  label: string;
  gold?: boolean;
}) => (
  <div className='flex flex-col items-center rounded-lg bg-[#302d29] px-2 py-2.5'>
    <span
      className={cn(
        'text-2xl font-bold tabular-nums',
        gold ? 'text-[#ffd27a]' : 'text-white',
      )}
    >
      {value}
    </span>
    <span className='text-xs text-[#a29e96]'>{label}</span>
  </div>
);

// Win/loss record and how their capturing pieces rolled against the odds.
// you: the viewer's own record
export const RecordCard = ({
  stats,
  you = true,
}: {
  stats: PlayerStats;
  you?: boolean;
}) => {
  const their = you ? 'Your' : 'Their';
  const rolls = Object.values(stats.traumas).reduce((a, b) => a + b, 0);
  const played = stats.wins + stats.losses + stats.draws;
  const top = rolls
    ? FATES.reduce((best, fate) =>
        stats.traumas[fate.trauma] / rolls - fate.odds >
        stats.traumas[best.trauma] / rolls - best.odds
          ? fate
          : best,
      )
    : null;

  return (
    <div className='grid gap-3.5 md:grid-cols-[1fr_1.4fr]'>
      <div className='flex flex-col gap-2.5 rounded-xl bg-[#262421] p-4'>
        <h3 className='font-semibold text-white'>Online record</h3>
        <div className='grid grid-cols-3 gap-2'>
          <Tally value={stats.wins} label='Wins' gold />
          <Tally value={stats.losses} label='Losses' />
          <Tally value={stats.draws} label='Draws' />
        </div>
        <p className='text-[13px] text-[#a29e96]'>
          {played
            ? `Won ${pct(stats.wins / played)} of ${played} finished ${
                played === 1 ? 'game' : 'games'
              }.`
            : you
            ? 'Finish an online game to start your record.'
            : 'No finished online games yet.'}
        </p>
      </div>

      <div className='flex flex-col gap-2.5 rounded-xl bg-[#262421] p-4'>
        <h3 className='font-semibold text-white'>
          How {their.toLowerCase()} pieces took it
        </h3>
        {rolls ? (
          <>
            <div className='flex h-3 overflow-hidden rounded-full bg-[#302d29]'>
              {FATES.map(({ trauma, bar }) => (
                <span
                  key={trauma}
                  style={{
                    width: pct(stats.traumas[trauma] / rolls),
                    background: bar,
                  }}
                />
              ))}
            </div>
            <ul className='grid grid-cols-2 gap-x-3 gap-y-1.5'>
              {FATES.map(({ trauma, name, odds }) => (
                <li key={trauma} className='flex items-center gap-2'>
                  <Marker
                    trauma={trauma}
                    healed={false}
                    turnsLeft={trauma === 'devastated' ? 3 : 0}
                    kills={0}
                    className='block h-[30px] w-7 flex-none'
                  />
                  <span className='min-w-0 text-[13px] leading-tight'>
                    <span className='block text-white'>{name}</span>
                    <span className='text-[#a29e96] tabular-nums'>
                      {stats.traumas[trauma]} ·{' '}
                      {pct(stats.traumas[trauma] / rolls)}{' '}
                      <span className='opacity-70'>(odds {pct(odds)})</span>
                    </span>
                  </span>
                </li>
              ))}
            </ul>
            {top && (
              <p className='text-[13px] text-[#a29e96]'>
                {rolls} first captures. {their} pieces lean{' '}
                <strong className='text-[#ffd27a]'>
                  {top.name.toLowerCase()}
                </strong>
                .
              </p>
            )}
          </>
        ) : (
          <p className='text-[13px] text-[#a29e96]'>
            No captures yet. {their} pieces are still innocent.
          </p>
        )}
      </div>
    </div>
  );
};
