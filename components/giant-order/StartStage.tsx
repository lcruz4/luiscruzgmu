import { Download } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import { cn } from '@/lib/utils';
import type { CartResponse, Report } from '@/types/giantOrder';
import {
  cardClass,
  labelClass,
  money,
  primaryButton,
  secondaryButton,
} from './styles';
import { usePullKeep, useSetList, useStartCheckout } from './useGiant';

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

// What "Add to cart" did
const CartReport = ({ report }: { report: Report }) => (
  <section className={cn(cardClass, 'flex flex-col gap-3 p-4')}>
    <h2 className='m-0 text-[17px] font-extrabold'>
      {report.dryRun ? 'Dry run' : 'Added to cart'}
    </h2>
    {report.aborted && (
      <p className='m-0 rounded-xl bg-mist-warn-banner p-3 text-sm font-semibold text-mist-warn-text'>
        Stopped ({report.aborted.reason}): {report.aborted.detail}
      </p>
    )}
    <ReportSection
      title='Added'
      rows={report.added.map(
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
    {report.cart && (
      <p className='m-0 text-sm font-semibold'>
        Cart: {report.cart.itemCount} items, {money(report.cart.subTotal)}
        {report.cart.belowMinimum &&
          ` (below the ${money(report.cart.minimum)} minimum)`}
      </p>
    )}
  </section>
);

// Secondary when "Check out" is the next step
const PasteList = ({ primary }: { primary: boolean }) => {
  const [text, setText] = useState('');
  const [empty, setEmpty] = useState(false);
  // Stays on through edits, so quantities can be added after pulling
  const [fromKeep, setFromKeep] = useState(false);
  const setList = useSetList();
  const pullKeep = usePullKeep();
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!text.trim()) return setEmpty(true);
    setList.mutate({ text, fromKeep });
  };
  const pull = () =>
    pullKeep.mutate(undefined, {
      onSuccess: (items) => {
        setText(items.join('\n'));
        setFromKeep(items.length > 0);
        setEmpty(items.length === 0);
      },
    });
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
          onClick={pull}
          disabled={pullKeep.isPending}
          className='flex cursor-pointer items-center gap-1.5 text-[13px] font-bold text-mist-cyan-text disabled:cursor-default disabled:opacity-50'
        >
          <Download size={15} aria-hidden />
          {pullKeep.isPending ? 'Pulling…' : 'Pull from Keep'}
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
      {fromKeep && (
        <p className='m-0 text-[13px] font-medium text-mist-muted'>
          Ordered items get checked off in Keep
        </p>
      )}
      {empty && (
        <p className='m-0 text-[13px] text-mist-pink-text'>
          {pullKeep.isSuccess
            ? 'Nothing unchecked in Keep'
            : 'Add at least one item'}
        </p>
      )}
      {pullKeep.error && (
        <p className='m-0 text-[13px] font-medium text-mist-pink-text'>
          {pullKeep.error.message}
        </p>
      )}
      <button
        type='submit'
        className={primary ? primaryButton : secondaryButton}
        disabled={setList.isPending}
      >
        {setList.isPending ? 'Saving…' : 'Start'}
      </button>
      {setList.error && (
        <p className='m-0 text-[13px] font-medium text-mist-pink-text'>
          {setList.error.message}
        </p>
      )}
    </form>
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
      <PasteList primary={!report || !canCheckOut} />
    </>
  );
};
