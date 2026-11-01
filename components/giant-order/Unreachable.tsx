import { LaptopMinimal, LoaderCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { cardClass, secondaryButton } from './styles';
import { RECONNECT_MS } from './useGiant';

// giant-cart serve runs on the Mac, so a closed laptop lands here
export const Unreachable = ({
  checking,
  onRetry,
}: {
  checking: boolean;
  onRetry: () => void;
}) => (
  <div className='flex flex-1 flex-col justify-center'>
    <section
      className={cn(cardClass, 'flex flex-col items-center gap-4 px-5 py-8')}
    >
      <div className='flex size-16 items-center justify-center rounded-full bg-mist-raised text-mist-cyan-text'>
        <LaptopMinimal size={32} strokeWidth={2} aria-hidden />
      </div>
      <div className='flex flex-col gap-1.5 text-center'>
        <h2 className='m-0 text-[19px] font-extrabold'>Can’t reach your Mac</h2>
        <p className='m-0 text-[15px] font-medium text-mist-muted'>
          Giant order runs through giant-cart on your laptop. Open it and this
          page reconnects on its own.
        </p>
      </div>
      <button
        type='button'
        className={cn(secondaryButton, 'w-full')}
        onClick={onRetry}
        disabled={checking}
      >
        {checking ? (
          <>
            <LoaderCircle size={18} className='animate-spin' aria-hidden />
            Checking…
          </>
        ) : (
          'Try now'
        )}
      </button>
      <p className='m-0 text-xs font-semibold text-mist-muted'>
        Checking every {RECONNECT_MS / 1000} seconds
      </p>
    </section>
  </div>
);
