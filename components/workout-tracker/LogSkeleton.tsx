const bar = 'rounded-md bg-mist-skeleton';
const card =
  'rounded-2xl border border-mist-line bg-mist-surface shadow-mist-card';

export const LogSkeleton = () => (
  <div aria-busy className='flex flex-1 animate-pulse flex-col'>
    <span className='sr-only'>Loading today’s workout</span>
    <div
      aria-hidden
      className='flex items-end justify-between gap-3 border-b-2 border-mist-line bg-mist-header px-4 pt-5 pb-4'
    >
      <div className='flex flex-col gap-2.5'>
        <div className={`h-3 w-[120px] ${bar}`} />
        <div className='h-[26px] w-[190px] rounded-lg bg-mist-skeleton-strong' />
        <div className={`h-3.5 w-[130px] ${bar}`} />
      </div>
      <div className='h-11 w-24 rounded-[12px] bg-mist-skeleton' />
    </div>
    <div aria-hidden className='flex flex-1 flex-col gap-3 p-4'>
      <div className={`flex flex-col gap-3.5 p-4 ${card}`}>
        <div className='flex items-center gap-3'>
          <div className='size-7 rounded-full bg-mist-skeleton' />
          <div className='h-[18px] w-[170px] rounded-md bg-mist-skeleton-strong' />
        </div>
        <div className={`h-3.5 w-[150px] ${bar}`} />
        <div className={`h-3.5 w-[190px] ${bar}`} />
      </div>
      <div className={`h-[76px] ${card}`} />
      <div className={`h-[76px] ${card}`} />
    </div>
  </div>
);
