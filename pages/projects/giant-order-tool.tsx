import { LoaderCircle } from 'lucide-react';
import { useState } from 'react';
import { CheckoutStage } from '@/components/giant-order/CheckoutStage';
import { GiantLayout } from '@/components/giant-order/GiantLayout';
import { ListStage } from '@/components/giant-order/ListStage';
import { ResultCard } from '@/components/giant-order/ResultCard';
import { StartStage } from '@/components/giant-order/StartStage';
import { secondaryButton } from '@/components/giant-order/styles';
import { Unreachable } from '@/components/giant-order/Unreachable';
import {
  isUnreachable,
  useCheckKeep,
  useCheckout,
  useList,
} from '@/components/giant-order/useGiant';
import { requireGiantLogin } from '@/services/giantOrder';
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
  const checkKeep = useCheckKeep();
  const onResult = (checkoutResult: CheckoutResult) => {
    setResult(checkoutResult);
    if (checkoutResult.kind === 'placed') checkKeep.mutate();
  };
  const list = useList();
  const listEmpty = list.data?.length === 0;
  const checkout = useCheckout(listEmpty);
  // Each reconnect check resets the list to loading, so hold on to
  // Unreachable until a check answers
  const [offline, setOffline] = useState(false);
  const listUnreachable = isUnreachable(list.error);
  if (!list.isFetching && offline !== listUnreachable) {
    setOffline(listUnreachable);
  }

  if (offline || listUnreachable) {
    return (
      <Unreachable checking={list.isFetching} onRetry={() => list.refetch()} />
    );
  }
  if (list.error) return <LoadError message={list.error.message} />;
  if (!list.data) return <Loading />;
  if (list.data.length > 0) {
    return <ListStage lines={list.data} onFilled={setFilled} />;
  }
  if (checkout.error) return <LoadError message={checkout.error.message} />;
  if (checkout.data === undefined) return <Loading />;
  if (checkout.data) {
    return <CheckoutStage question={checkout.data} onResult={onResult} />;
  }
  if (result) {
    return (
      <ResultCard
        result={result}
        keep={checkKeep}
        onDone={() => {
          checkKeep.reset();
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

export const getServerSideProps = requireGiantLogin;

export default GiantOrderPage;
