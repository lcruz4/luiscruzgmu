import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CheckoutResult, KeepCheck } from '@/types/giantOrder';
import { cardClass, money, primaryButton } from './styles';

const cutoffLabel = (cutoff: string) =>
  new Date(cutoff).toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

const Row = ({ label, value }: { label: string; value: string }) => (
  <div className='flex justify-between gap-4 text-sm'>
    <span className='font-medium text-mist-muted'>{label}</span>
    <span className='text-right font-semibold'>{value}</span>
  </div>
);

type KeepStatus = {
  data?: KeepCheck | null;
  error: Error | null;
  isPending: boolean;
};

const KeepRows = ({ keep }: { keep: KeepCheck }) =>
  keep.checked.length + keep.failed.length === 0 ? null : (
    <div className='flex w-full flex-col gap-1 text-sm font-medium'>
      {keep.checked.length > 0 && (
        <p className='m-0'>Checked in Keep: {keep.checked.join(', ')}</p>
      )}
      {keep.failed.length > 0 && (
        <p className='m-0 text-mist-pink-text'>
          Couldn’t check in Keep: {keep.failed.join(', ')}
        </p>
      )}
    </div>
  );

export const ResultCard = ({
  result,
  keep,
  onDone,
}: {
  result: CheckoutResult;
  keep: KeepStatus;
  onDone: () => void;
}) => (
  <section
    className={cn(cardClass, 'mt-6 flex flex-col items-center gap-4 p-5')}
  >
    {result.kind === 'placed' ? (
      <>
        <div className='flex size-14 items-center justify-center rounded-full bg-mist-cyan text-mist-ink'>
          <Check size={28} strokeWidth={3} aria-hidden />
        </div>
        <div className='text-center'>
          <h1 className='m-0 text-[22px] font-extrabold'>Order placed</h1>
          <p className='m-0 text-[13px] font-medium text-mist-muted'>
            {result.orderId} · {money(result.total)}
          </p>
        </div>
        <div className='flex w-full flex-col gap-2 rounded-xl bg-mist-raised p-3'>
          <Row label='Pickup' value={result.pickup} />
          <Row label='Card' value={result.card} />
          {result.cutoffTime && (
            <Row label='Edit until' value={cutoffLabel(result.cutoffTime)} />
          )}
        </div>
        {keep.isPending && (
          <p className='m-0 text-sm font-medium text-mist-muted'>
            Checking items in Keep…
          </p>
        )}
        {keep.data && <KeepRows keep={keep.data} />}
        {keep.error && (
          <p className='m-0 text-sm font-medium text-mist-pink-text'>
            Couldn’t check items in Keep: {keep.error.message}
          </p>
        )}
      </>
    ) : (
      <div className='text-center'>
        <h1 className='m-0 text-[22px] font-extrabold'>Checkout cancelled</h1>
        <p className='m-0 text-sm font-medium text-mist-muted'>
          {result.reservedSlot
            ? `${result.reservedSlot} stays reserved on the cart.`
            : 'Nothing was reserved.'}
        </p>
      </div>
    )}
    <button
      type='button'
      className={cn(primaryButton, 'w-full')}
      onClick={onDone}
    >
      Done
    </button>
  </section>
);
