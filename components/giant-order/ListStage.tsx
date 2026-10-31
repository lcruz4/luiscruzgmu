import {
  Check,
  CircleHelp,
  Clock,
  LoaderCircle,
  Minus,
  ShoppingCart,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type {
  CartResponse,
  GroceryLine,
  Product,
  Question,
  Review,
} from '@/types/giantOrder';
import { QuestionPanel } from './QuestionPanel';
import { cardClass, money, primaryButton, secondaryButton } from './styles';
import { useClearList, useFillCart, useQuestion } from './useGiant';

const questionKey = (question: Question) =>
  `${question.kind}-${question.lineId}-${question.message}`;

const StatusIcon = ({ line, open }: { line: GroceryLine; open: boolean }) => {
  const Icon = open
    ? CircleHelp
    : line.status === 'resolved'
    ? Check
    : line.status === 'skipped'
    ? Minus
    : Clock;
  return (
    <Icon
      size={18}
      className={cn(
        'shrink-0',
        open || line.status === 'resolved'
          ? 'text-mist-cyan-text'
          : 'text-mist-muted',
      )}
      aria-hidden
    />
  );
};

const statusText = (line: GroceryLine) => {
  if (line.status === 'skipped') return 'Skipped';
  if (line.status === 'quantity') return 'Needs quantity';
  if (line.status === 'match') return 'Not checked';
  return null;
};

const Thumb = ({ product }: { product: Product }) =>
  product.image ? (
    <img
      src={product.image.small}
      alt=''
      className='size-10 shrink-0 rounded-lg bg-mist-surface object-contain'
    />
  ) : (
    <div className='size-10 shrink-0 rounded-lg bg-mist-raised' />
  );

const LineRow = ({
  line,
  product,
  question,
  initialQuantity,
}: {
  line: GroceryLine;
  // Known once every line is answered
  product: Product | undefined;
  question: Question | null;
  initialQuantity: number;
}) => {
  const open = question?.lineId === line.id;
  const merging =
    question?.kind === 'total' && question.mergeIds.includes(line.id);
  const status = statusText(line);
  return (
    <li className='flex flex-col gap-2 border-b border-mist-line py-3 last:border-b-0'>
      <div className='flex items-center gap-3'>
        {product ? (
          <Thumb product={product} />
        ) : (
          <StatusIcon line={line} open={open} />
        )}
        <div className='flex min-w-0 flex-1 flex-col'>
          <span
            className={cn(
              'text-[15px] font-bold',
              line.status === 'skipped' && 'text-mist-muted line-through',
            )}
          >
            {line.name}
          </span>
          {product && (
            <span className='text-[13px] font-medium text-mist-muted'>
              {product.name} · {product.size}
            </span>
          )}
        </div>
        {product ? (
          <span className='text-right text-[13px] font-semibold tabular-nums'>
            {line.quantity} × {money(product.price)}
          </span>
        ) : merging ? (
          <span className='text-[13px] font-semibold text-mist-cyan-text'>
            Merging
          </span>
        ) : (
          !open && (
            <span className='text-[13px] font-medium text-mist-muted'>
              {status ?? (line.quantity !== null && `×${line.quantity}`)}
            </span>
          )
        )}
      </div>
      {open && question && (
        <QuestionPanel
          key={questionKey(question)}
          question={question}
          initialQuantity={initialQuantity}
        />
      )}
    </li>
  );
};

const ReviewFooter = ({
  review,
  onFilled,
}: {
  review: Review;
  onFilled: (response: CartResponse) => void;
}) => {
  const fill = useFillCart();
  return (
    <div className={cn(cardClass, 'flex flex-col gap-3 p-4')}>
      <div className='flex items-baseline justify-between'>
        <span className='text-[15px] font-bold'>
          {review.items.length} items
        </span>
        <span className='text-[13px] font-medium text-mist-muted'>
          Estimated{' '}
          <span className='text-lg font-extrabold text-mist-text'>
            {money(review.total)}
          </span>
        </span>
      </div>
      <button
        type='button'
        className={primaryButton}
        disabled={fill.isPending}
        onClick={() => fill.mutate(false, { onSuccess: onFilled })}
      >
        <ShoppingCart size={18} aria-hidden />
        {fill.isPending ? 'Adding to cart…' : 'Add to cart'}
      </button>
      <button
        type='button'
        className={secondaryButton}
        disabled={fill.isPending}
        onClick={() => fill.mutate(true, { onSuccess: onFilled })}
      >
        Dry run
      </button>
      {fill.error && (
        <p className='m-0 text-[13px] font-medium text-mist-pink-text'>
          {fill.error.message}
        </p>
      )}
    </div>
  );
};

// The grocery list with its one open question inline; once every line is
// answered, what goes in the cart
export const ListStage = ({
  lines,
  onFilled,
}: {
  lines: GroceryLine[];
  onFilled: (response: CartResponse) => void;
}) => {
  const { data, error, isFetching, refetch } = useQuestion(true);
  const clear = useClearList();
  const question = data?.question ?? null;
  const review = data?.review ?? null;
  const products = new Map(
    review?.items.map((item) => [item.prodId, item.product]),
  );
  const done = lines.filter(
    ({ status }) => status === 'resolved' || status === 'skipped',
  ).length;

  const initialQuantity = (() => {
    if (question?.kind !== 'total') return 1;
    const ids = [question.lineId, ...question.mergeIds];
    return lines
      .filter((line) => ids.includes(line.id))
      .reduce((sum, line) => sum + (line.quantity ?? 1), 0);
  })();

  const startOver = () => {
    if (window.confirm('Clear the whole list?')) clear.mutate();
  };

  return (
    <>
      <header className='flex items-center justify-between'>
        <div className='flex flex-col'>
          <h1 className='m-0 text-[22px] font-extrabold'>Grocery list</h1>
          <span className='text-[13px] font-medium text-mist-muted'>
            {done} of {lines.length} done
          </span>
        </div>
        <button
          type='button'
          onClick={startOver}
          disabled={clear.isPending}
          className='cursor-pointer text-[13px] font-bold text-mist-cyan-text'
        >
          Start over
        </button>
      </header>

      {isFetching && !data && (
        <div className='flex items-center gap-2 text-[13px] font-medium text-mist-muted'>
          <LoaderCircle size={16} className='animate-spin' aria-hidden />
          Matching your list with Giant…
        </div>
      )}
      {error && (
        <div className={cn(cardClass, 'flex flex-col gap-3 p-4')}>
          <p className='m-0 text-[15px] font-semibold'>{error.message}</p>
          <button
            type='button'
            className={secondaryButton}
            onClick={() => void refetch()}
          >
            Try again
          </button>
        </div>
      )}

      <section className={cn(cardClass, 'px-4 py-1')}>
        <h2 className='sr-only'>Items</h2>
        <ul className='m-0 list-none p-0'>
          {lines.map((line) => (
            <LineRow
              key={line.id}
              line={line}
              product={
                line.prodId === null ? undefined : products.get(line.prodId)
              }
              question={question}
              initialQuantity={initialQuantity}
            />
          ))}
        </ul>
      </section>

      {review && <ReviewFooter review={review} onFilled={onFilled} />}
    </>
  );
};
