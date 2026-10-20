// Reload re-runs the page's login check, so an expired login ends up at sign-in
export const LoadError = () => (
  <main className='flex flex-1 flex-col items-center justify-center gap-6 px-6 py-8 text-center'>
    <p className='m-0 text-base leading-6 font-medium text-mist-muted'>
      Couldn’t load the workout.
    </p>
    <button
      type='button'
      onClick={() => window.location.reload()}
      className='h-11 cursor-pointer rounded-[14px] bg-mist-cyan px-[18px] text-[15px] font-extrabold text-mist-ink'
    >
      Reload
    </button>
  </main>
);
