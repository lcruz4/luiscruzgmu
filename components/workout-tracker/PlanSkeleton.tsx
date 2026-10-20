const card =
  'rounded-2xl border border-mist-line bg-mist-surface shadow-mist-card';

export const PlanSkeleton = () => (
  <div aria-busy className='flex flex-1 animate-pulse flex-col'>
    <span className='sr-only'>Loading the plan</span>
    <div
      aria-hidden
      className='flex flex-col gap-2.5 border-b border-mist-line bg-mist-header px-4 pt-5 pb-4'
    >
      <div className='h-[26px] w-[90px] rounded-lg bg-mist-skeleton-strong' />
      <div className='h-3.5 w-[170px] rounded-md bg-mist-skeleton' />
    </div>
    <div aria-hidden className='flex flex-1 flex-col gap-3 p-4'>
      <div className='h-[54px] rounded-[14px] bg-mist-skeleton' />
      <div className='grid grid-cols-4 gap-2'>
        {[1, 2, 3, 4].map((d) => (
          <div key={d} className='h-14 rounded-[12px] bg-mist-skeleton' />
        ))}
      </div>
      <div className={`h-[340px] ${card}`} />
    </div>
  </div>
);
