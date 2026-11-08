import { Download, LoaderCircle, Plus, RefreshCw } from 'lucide-react';
import { type FormEvent, type ReactNode, useState } from 'react';
import { cn } from '@/lib/utils';
import type {
  CartResponse,
  KeepItem,
  KeepList,
  Report,
} from '@/types/giantOrder';
import {
  cardClass,
  inputClass,
  labelClass,
  linkButton,
  money,
  primaryButton,
  secondaryButton,
} from './styles';
import { ProductThumb } from './ProductThumb';
import {
  useAddKeepItem,
  useCart,
  useKeepList,
  useSetList,
  useUpdateKeepItem,
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

const CartSkeleton = () => (
  <ul
    className='m-0 flex list-none animate-pulse flex-col p-0'
    aria-label='Loading the cart'
  >
    {[0, 1, 2].map((row) => (
      <li
        key={row}
        className='flex items-center gap-3 border-b border-mist-line py-2 last:border-b-0'
      >
        <div className='size-10 shrink-0 rounded-lg bg-mist-skeleton' />
        <div className='flex flex-1 flex-col gap-1.5'>
          <div className='h-3.5 w-3/4 rounded-md bg-mist-skeleton-strong' />
          <div className='h-3 w-1/3 rounded-md bg-mist-skeleton' />
        </div>
        <div className='h-3.5 w-14 rounded-md bg-mist-skeleton' />
      </li>
    ))}
  </ul>
);

// The active cart as Giant has it, however it was filled
const CartPanel = ({ children }: { children?: ReactNode }) => {
  const cart = useCart();
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
          {cart.isFetching ? 'Loading…' : 'Refresh'}
        </button>
      </div>
      {!cart.data && cart.isFetching && <CartSkeleton />}
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
      {children}
    </section>
  );
};

// Tap the text to rename; Enter or leaving the field saves, Escape cancels
const KeepRow = ({
  item,
  onCheck,
  onRename,
}: {
  item: KeepItem;
  onCheck: (checked: boolean) => void;
  onRename: (text: string) => void;
}) => {
  const [draft, setDraft] = useState<string | null>(null);
  const save = () => {
    if (draft === null) return;
    const text = draft.trim();
    setDraft(null);
    if (text && text !== item.text) onRename(text);
  };
  return (
    <li className='flex items-center gap-3 py-1'>
      <input
        type='checkbox'
        aria-label={item.text}
        checked={item.checked}
        onChange={(event) => onCheck(event.target.checked)}
        className='size-5 shrink-0 cursor-pointer accent-mist-cyan-text'
      />
      {draft === null ? (
        <button
          type='button'
          onClick={() => setDraft(item.text)}
          className={cn(
            'min-h-9 flex-1 cursor-text text-left text-[15px] font-semibold',
            item.checked && 'text-mist-muted line-through',
          )}
        >
          {item.text}
        </button>
      ) : (
        <input
          autoFocus
          onFocus={(event) => event.target.select()}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={save}
          onKeyDown={(event) => {
            if (event.key === 'Enter') save();
            if (event.key === 'Escape') setDraft(null);
          }}
          className={cn(inputClass, 'h-9 flex-1')}
        />
      )}
    </li>
  );
};

const AddKeepItem = ({ noteId }: { noteId: string }) => {
  const [text, setText] = useState('');
  const add = useAddKeepItem();
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!text.trim()) return;
    add.mutate({ noteId, text: text.trim() }, { onSuccess: () => setText('') });
  };
  return (
    <form onSubmit={submit} className='flex flex-col gap-2'>
      <div className='flex gap-2'>
        <input
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder='Add an item'
          aria-label='New Keep item'
          className={cn(inputClass, 'flex-1')}
        />
        <button
          type='submit'
          disabled={add.isPending || !text.trim()}
          className={secondaryButton}
          aria-label='Add'
        >
          {add.isPending ? (
            <LoaderCircle size={18} className='animate-spin' aria-hidden />
          ) : (
            <Plus size={18} aria-hidden />
          )}
        </button>
      </div>
      <ErrorText error={add.error} />
    </form>
  );
};

// The unchecked Keep items. Checking one off, renaming or adding updates
// Keep, so the list can be tidied before it starts; the open items become
// the list.
const KeepChecklist = ({
  keep,
  primary,
  pulling,
  onPull,
}: {
  keep: KeepList;
  primary: boolean;
  pulling: boolean;
  onPull: () => void;
}) => {
  const update = useUpdateKeepItem();
  const setList = useSetList();
  const open = keep.items.filter((item) => !item.checked);
  const start = () =>
    setList.mutate({
      lines: open.map((item) => ({ text: item.text, keepItemId: item.id })),
    });
  return (
    <>
      <button
        type='button'
        onClick={onPull}
        disabled={pulling}
        className={cn(linkButton, 'self-end')}
      >
        <RefreshCw size={15} aria-hidden />
        {pulling ? 'Pulling…' : 'Pull again'}
      </button>
      {keep.items.length === 0 ? (
        <p className='m-0 text-[13px] font-medium text-mist-muted'>
          Nothing unchecked in Keep
        </p>
      ) : (
        <ul className='m-0 flex list-none flex-col p-0'>
          {keep.items.map((item) => (
            <KeepRow
              key={item.id}
              item={item}
              onCheck={(checked) =>
                update.mutate({
                  noteId: keep.noteId,
                  item,
                  change: { checked },
                })
              }
              onRename={(text) =>
                update.mutate({ noteId: keep.noteId, item, change: { text } })
              }
            />
          ))}
        </ul>
      )}
      <AddKeepItem noteId={keep.noteId} />
      <p className='m-0 text-[13px] font-medium text-mist-muted'>
        Check off what you don’t need; ordered items get checked once the order
        is placed
      </p>
      <ErrorText error={update.error} />
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
    </>
  );
};

// Not pulled yet, or the pull failed
const KeepPull = ({
  keepList,
}: {
  keepList: ReturnType<typeof useKeepList>;
}) => (
  <>
    <button
      type='button'
      onClick={() => keepList.refetch()}
      disabled={keepList.isFetching}
      className={secondaryButton}
    >
      <Download size={15} aria-hidden />
      {keepList.isFetching ? 'Pulling…' : 'Pull from Keep'}
    </button>
    <ErrorText error={keepList.error} />
  </>
);

const PasteForm = ({ primary }: { primary: boolean }) => {
  const [text, setText] = useState('');
  const [empty, setEmpty] = useState(false);
  const setList = useSetList();
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!text.trim()) return setEmpty(true);
    setList.mutate({ text });
  };
  return (
    <form onSubmit={submit} className='flex flex-col gap-3'>
      <label htmlFor='grocery-list' className='sr-only'>
        Paste your list
      </label>
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
      {empty && (
        <p className='m-0 text-[13px] text-mist-pink-text'>
          Add at least one item
        </p>
      )}
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

const TABS = [
  { id: 'keep', label: 'Keep list' },
  { id: 'paste', label: 'Paste' },
] as const;

type Tab = (typeof TABS)[number]['id'];

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
  const [tab, setTab] = useState<Tab>('keep');
  return (
    <section className={cn(cardClass, 'flex flex-col gap-3 p-4')}>
      <div
        role='tablist'
        className='flex rounded-[14px] border border-mist-line bg-mist-surface p-1'
      >
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            type='button'
            role='tab'
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={cn(
              'h-9 flex-1 cursor-pointer rounded-[10px] text-sm font-bold text-mist-muted',
              tab === id && 'bg-mist-cyan text-mist-ink',
            )}
          >
            {label}
          </button>
        ))}
      </div>
      {tab === 'paste' ? (
        <PasteForm primary={primary} />
      ) : keepList.data ? (
        <KeepChecklist
          keep={keepList.data}
          primary={primary}
          pulling={keepList.isFetching}
          onPull={() => keepList.refetch()}
        />
      ) : (
        <KeepPull keepList={keepList} />
      )}
    </section>
  );
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
      <CartPanel>
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
      </CartPanel>
      <NewList primary={!report || !canCheckOut} autoPull={!filled} />
    </>
  );
};
