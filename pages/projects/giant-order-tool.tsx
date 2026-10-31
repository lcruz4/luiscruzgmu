import { LoaderCircle } from 'lucide-react';
import { useState } from 'react';
import { CheckoutStage } from '@/components/giant-order/CheckoutStage';
import { GiantLayout } from '@/components/giant-order/GiantLayout';
import { ListStage } from '@/components/giant-order/ListStage';
import { ResultCard } from '@/components/giant-order/ResultCard';
import { StartStage } from '@/components/giant-order/StartStage';
import { secondaryButton } from '@/components/giant-order/styles';
import { useCheckout, useList } from '@/components/giant-order/useGiant';
import { requireGiantOwner } from '@/services/giantOrder';
import type { CartResponse, CheckoutResult } from '@/types/giantOrder';

const Loading = () => (
  <div className='flex flex-1 items-center justify-center text-mist-muted'>
    <LoaderCircle size={28} className='animate-spin' aria-label='Loading' />
  </div>
);

const LoadError = ({ message }: { message: string }) => (
  <div className='flex flex-1 flex-col items-center justify-center gap-4 text-center'>
    <p className='m-0 text-[15px] font-medium text-mist-muted'>{message}</p>
    <button
      type='button'
      className={secondaryButton}
      onClick={() => window.location.reload()}
    >
      Reload
    </button>
  </div>
);

// Server state picks the stage: an open list, then an open checkout, then a
// fresh start. A cart fill or checkout result only lives on this page.
const GiantOrder = () => {
  const [filled, setFilled] = useState<CartResponse | null>(null);
  const [result, setResult] = useState<CheckoutResult | null>(null);
  const list = useList();
  const listEmpty = list.data?.length === 0;
  const checkout = useCheckout(listEmpty);

  if (list.error) return <LoadError message={list.error.message} />;
  if (!list.data) return <Loading />;
  if (list.data.length > 0) {
    return <ListStage lines={list.data} onFilled={setFilled} />;
  }
  if (checkout.error) return <LoadError message={checkout.error.message} />;
  if (checkout.data === undefined) return <Loading />;
  if (checkout.data) {
    return <CheckoutStage question={checkout.data} onResult={setResult} />;
  }
  if (result) {
    return (
      <ResultCard
        result={result}
        onDone={() => {
          setResult(null);
          setFilled(null);
        }}
      />
    );
  }
  return <StartStage filled={filled} />;
};

const GiantOrderPage = () => (
  <GiantLayout>
    <GiantOrder />
  </GiantLayout>
);

export const getServerSideProps = requireGiantOwner;

export default GiantOrderPage;
