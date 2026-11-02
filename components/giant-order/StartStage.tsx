import { Download, LoaderCircle, RefreshCw } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import { cn } from '@/lib/utils';
import type { CartResponse, KeepList, Report } from '@/types/giantOrder';
import {
  cardClass,
  labelClass,
  linkButton,
  money,
  primaryButton,
  secondaryButton,
} from './styles';
import { ProductThumb } from './ProductThumb';
import {
  useCart,
  useKeepList,
  useSetKeepChecked,
  useSetList,
  useStartCheckout,
} from './useGiant';

const ErrorText = ({ error }: { error: Error | null }) =>
  error && (
    <p className='m-0 text-[13px] font-medium text-mist-pink-text'>
      {error.message}
    </p>
  );

const ReportSection = ({ title, rows }: { title: string; rows: string[] }) =>
  rows.length === 0 ? null : (
    <div className='flex flex-col gap-1'>
      <h3 className={cn(labelClass, 'm-0')}>
        {title} ({rows.length})
      </h3>
      <ul className='m-0 list-none p-0 text-sm font-medium'>
        {rows.map((row) => (
          <li key={row}>{row}</li>
        ))}
      </ul>
    </div>
  );

// What "Add to cart" did. A real fill's items show in the cart below, so
// only what went wrong is listed.
const CartReport = ({ report }: { report: Report }) => (
  <section className={cn(cardClass, 'flex flex-col gap-3 p-4')}>
    <h2 className='m-0 text-[17px] font-extrabold'>
      {report.dryRun ? 'Dry run' : 'Added to cart'}
    </h2>
    {!report.dryRun && (
      <p className='m-0 text-sm font-medium'>
        {report.added.length} {report.added.length === 1 ? 'item' : 'items'}{' '}
        added
      </p>
    )}
    {report.aborted && (
      <p className='m-0 rounded-xl bg-mist-warn-banner p-3 text-sm font-semibold text-mist-warn-text'>
        Stopped ({report.aborted.reason}): {report.aborted.detail}
      </p>
    )}
    <ReportSection
      title='Would add'
      rows={(report.dryRun ? report.added : []).map(
        (item) =>
          `${item.qtyAfter} × ${item.name} (${item.size}) ${money(item.price)}`,
      )}
    />
    <ReportSection
      title='Out of stock'
      rows={report.outOfStock.map((item) => `${item.input.name}: ${item.name}`)}
    />
    <ReportSection
      title='Failed'
      rows={report.failed.map((item) => `${item.input.name}: ${item.error}`)}
    />
  </section>
);

// The active cart as Giant has it, however it was filled. Each read opens
// Giant, so it loads on its own only right after a real fill.
const CartPanel = ({ autoLoad }: { autoLoad: boolean }) => {
  const cart = useCart(autoLoad);
  const below =
    cart.data?.minimum != null && cart.data.subTotal < cart.data.minimum;
  return (
    <section className={cn(cardClass, 'flex flex-col gap-3 p-4')}>
      <div className='flex items-center justify-between gap-2'>
        <h2 className='m-0 text-[17px] font-extrabold'>Cart</h2>
        <button
          type='button'
          onClick={() => cart.refetch()}
          disabled={cart.isFetching}
          className={linkButton}
        >
          {cart.isFetching ? (
            <LoaderCircle size={15} className='animate-spin' aria-hidden />
          ) : (
            <RefreshCw size={15} aria-hidden />
          )}
          {cart.isFetching ? 'Loading…' : cart.data ? 'Refresh' : 'Show cart'}
        </button>
      </div>
      {cart.data && cart.data.items.length === 0 && (
        <p className='m-0 text-sm font-medium text-mist-muted'>
          The cart is empty
        </p>
      )}
      {cart.data && cart.data.items.length > 0 && (
        <>
          <ul className='m-0 flex list-none flex-col p-0'>
            {cart.data.items.map((item) => (
              <li
                key={item.prodId}
                className='flex items-center gap-3 border-b border-mist-line py-2 last:border-b-0'
              >
                <ProductThumb product={item.product ?? undefined} />
                <div className='flex min-w-0 flex-1 flex-col'>
                  <span className='text-sm font-bold'>{item.name}</span>
                  {item.product && (
                    <span className='text-[13px] font-medium text-mist-muted'>
                      {item.product.size}
                    </span>
                  )}
                </div>
                <span className='text-right text-[13px] font-semibold tabular-nums'>
                  {item.quantity} × {money(item.price)}
                </span>
              </li>
            ))}
          </ul>
          <p className='m-0 text-sm font-semibold'>
            Subtotal {money(cart.data.subTotal)}
            {below &&
              cart.data.minimum != null &&
              ` (below the ${money(cart.data.minimum)} minimum)`}
          </p>
        </>
      )}
      <ErrorText error={cart.error} />
    </section>
  );
};

// The unchecked Keep items. Checking one off updates Keep, so stale items
// can go before the list starts; the rest become the list.
const KeepChecklist = ({
  keep,
  primary,
  pulling,
  onPull,
  onPaste,
}: {
  keep: KeepList;
  primary: boolean;
  pulling: boolean;
  onPull: () => void;
  onPaste: () => void;
}) => {
  const setChecked = useSetKeepChecked();
  const setList = useSetList();
  const open = keep.items.filter((item) => !item.checked);
  const start = () =>
    setList.mutate({
      lines: open.map((item) => ({ text: item.text, keepItemId: item.id })),
    });
  return (
    <section className={cn(cardClass, 'flex flex-col gap-3 p-4')}>
      <div className='flex items-center justify-between gap-2'>
        <h2 className='m-0 text-[15px] font-bold'>Keep list</h2>
        <button
          type='button'
          onClick={onPull}
          disabled={pulling}
          className={linkButton}
        >
          <RefreshCw size={15} aria-hidden />
          {pulling ? 'Pulling…' : 'Pull again'}
        </button>
      </div>
      <ul className='m-0 flex list-none flex-col p-0'>
        {keep.items.map((item) => (
          <li key={item.id}>
            <label className='flex cursor-pointer items-center gap-3 py-2 text-[15px] font-semibold'>
              <input
                type='checkbox'
                checked={item.checked}
                onChange={(event) =>
                  setChecked.mutate({
                    noteId: keep.noteId,
                    itemId: item.id,
                    checked: event.target.checked,
                  })
                }
                className='size-5 shrink-0 cursor-pointer accent-mist-cyan-text'
              />
              <span
                className={cn(item.checked && 'text-mist-muted line-through')}
              >
                {item.text}
              </span>
            </label>
          </li>
        ))}
      </ul>
      <p className='m-0 text-[13px] font-medium text-mist-muted'>
        Check off what you don’t need; ordered items get checked once the order
        is placed
      </p>
      <ErrorText error={setChecked.error} />
      <button
        type='button'
        className={primary ? primaryButton : secondaryButton}
        disabled={setList.isPending || open.length === 0}
        onClick={start}
      >
        {setList.isPending
          ? 'Saving…'
          : `Start with ${open.length} ${open.length === 1 ? 'item' : 'items'}`}
      </button>
      <ErrorText error={setList.error} />
      <button
        type='button'
        onClick={onPaste}
        className={cn(linkButton, 'self-center')}
      >
        Paste a list instead
      </button>
    </section>
  );
};

const PasteForm = ({
  primary,
  keepList,
}: {
  primary: boolean;
  keepList: ReturnType<typeof useKeepList>;
}) => {
  const [text, setText] = useState('');
  const [empty, setEmpty] = useState(false);
  const setList = useSetList();
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!text.trim()) return setEmpty(true);
    setList.mutate({ text });
  };
  return (
    <form
      onSubmit={submit}
      className={cn(cardClass, 'flex flex-col gap-3 p-4')}
    >
      <div className='flex items-center justify-between gap-2'>
        <label htmlFor='grocery-list' className='text-[15px] font-bold'>
          Paste your list
        </label>
        <button
          type='button'
          onClick={() => keepList.refetch()}
          disabled={keepList.isFetching}
          className={linkButton}
        >
          <Download size={15} aria-hidden />
          {keepList.isFetching ? 'Pulling…' : 'Pull from Keep'}
        </button>
      </div>
      <textarea
        id='grocery-list'
        rows={8}
        value={text}
        onChange={(event) => {
          setText(event.target.value);
          setEmpty(false);
        }}
        placeholder={'Oat milk\nSoy sauce\nCider TWO'}
        className='rounded-xl border border-mist-line bg-mist-surface p-3 text-[15px] leading-6'
      />
      {keepList.data?.items.length === 0 && (
        <p className='m-0 text-[13px] font-medium text-mist-muted'>
          Nothing unchecked in Keep
        </p>
      )}
      {empty && (
        <p className='m-0 text-[13px] text-mist-pink-text'>
          Add at least one item
        </p>
      )}
      <ErrorText error={keepList.error} />
      <button
        type='submit'
        className={primary ? primaryButton : secondaryButton}
        disabled={setList.isPending}
      >
        {setList.isPending ? 'Saving…' : 'Start'}
      </button>
      <ErrorText error={setList.error} />
    </form>
  );
};

// Secondary when "Check out" is the next step. `autoPull` pulls the Keep list
// on mount; "Pull from Keep" does it on demand.
const NewList = ({
  primary,
  autoPull,
}: {
  primary: boolean;
  autoPull: boolean;
}) => {
  const keepList = useKeepList(autoPull);
  const [pasting, setPasting] = useState(false);
  // A new pull shows the checklist again
  const [pulledAt, setPulledAt] = useState(0);
  if (keepList.dataUpdatedAt !== pulledAt) {
    setPulledAt(keepList.dataUpdatedAt);
    setPasting(false);
  }
  if (!pasting && keepList.data && keepList.data.items.length > 0) {
    return (
      <KeepChecklist
        keep={keepList.data}
        primary={primary}
        pulling={keepList.isFetching}
        onPull={() => keepList.refetch()}
        onPaste={() => setPasting(true)}
      />
    );
  }
  return <PasteForm primary={primary} keepList={keepList} />;
};

// No list open: what the last "Add to cart" did, checkout, or a new list
export const StartStage = ({ filled }: { filled: CartResponse | null }) => {
  const checkout = useStartCheckout();
  const report = filled?.report;
  const canCheckOut = !report || (!report.dryRun && !report.aborted);
  return (
    <>
      <h1 className='m-0 text-[22px] font-extrabold'>Giant order</h1>
      {filled && !report && (
        <p className='m-0 text-[15px] font-medium'>{filled.summary}</p>
      )}
      {report && <CartReport report={report} />}
      <CartPanel autoLoad={!!report && !report.dryRun && !report.aborted} />
      {canCheckOut && (
        <div className='flex flex-col gap-2'>
          <button
            type='button'
            className={report ? primaryButton : secondaryButton}
            disabled={checkout.isPending}
            onClick={() => checkout.mutate()}
          >
            {checkout.isPending
              ? 'Opening checkout…'
              : report
              ? 'Check out'
              : 'Check out the current cart'}
          </button>
          {checkout.error && (
            <p className='m-0 text-[13px] font-medium text-mist-pink-text'>
              {checkout.error.message}
            </p>
          )}
        </div>
      )}
      <NewList primary={!report || !canCheckOut} autoPull={!filled} />
    </>
  );
};
