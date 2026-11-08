import { LoaderCircle, Minus, Plus } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { Review, ReviewItem } from '@/types/giantOrder';
import { ErrorText, ProductSearch } from './ProductSearch';
import { ProductThumb } from './ProductThumb';
import { cardClass, linkButton, money } from './styles';
import { type LineEdit, useEditLine } from './useGiant';

const stepClass =
  'flex size-8 cursor-pointer items-center justify-center rounded-full border border-mist-line bg-mist-surface disabled:cursor-default disabled:opacity-40';

const ReviewRow = ({
  item,
  saving,
  locked,
  edit,
}: {
  item: ReviewItem;
  // This row's edit is in flight
  saving: boolean;
  // Any edit is in flight; serve takes one request at a time
  locked: boolean;
  edit: (change: Omit<LineEdit, 'lineId'>, onSuccess?: () => void) => void;
}) => {
  const [changing, setChanging] = useState(false);
  const [remember, setRemember] = useState(false);
  const { product, quantity } = item;
  return (
    <li className='flex flex-col gap-2 border-b border-mist-line py-3 last:border-b-0'>
      <div className='flex items-center gap-3'>
        <ProductThumb product={product} />
        <div className='flex min-w-0 flex-1 flex-col'>
          <span className='text-[15px] font-bold'>{item.name}</span>
          <span className='text-[13px] font-medium text-mist-muted'>
            {product.name} · {product.size} · {money(product.price)}
          </span>
          <button
            type='button'
            onClick={() => setChanging(!changing)}
            className={cn(linkButton, 'self-start')}
          >
            {changing ? 'Cancel' : 'Change product'}
          </button>
        </div>
        <div className='flex shrink-0 flex-col items-end gap-1'>
          <div className='flex items-center gap-2'>
            <button
              type='button'
              aria-label={`Fewer ${item.name}`}
              className={stepClass}
              disabled={locked || quantity <= 1}
              onClick={() => edit({ quantity: quantity - 1 })}
            >
              <Minus size={14} aria-hidden />
            </button>
            <span className='flex min-w-6 justify-center text-[15px] font-extrabold tabular-nums'>
              {saving ? (
                <LoaderCircle
                  size={16}
                  className='animate-spin text-mist-muted'
                  aria-label='Saving'
                />
              ) : (
                quantity
              )}
            </span>
            <button
              type='button'
              aria-label={`More ${item.name}`}
              className={stepClass}
              disabled={locked}
              onClick={() => edit({ quantity: quantity + 1 })}
            >
              <Plus size={14} aria-hidden />
            </button>
          </div>
          <span className='text-[13px] font-semibold tabular-nums'>
            {money(product.price * quantity)}
          </span>
        </div>
      </div>
      {changing && (
        <div className='flex flex-col gap-3 rounded-2xl border-2 border-mist-cyan-line bg-mist-raised p-3'>
          <ProductSearch
            initial={item.name}
            onPick={(picked) =>
              !locked &&
              edit({ prodId: picked.prodId, remember }, () =>
                setChanging(false),
              )
            }
          />
          <label className='flex items-center gap-3 text-sm font-semibold'>
            <input
              type='checkbox'
              checked={remember}
              onChange={(event) => setRemember(event.target.checked)}
              className='size-5 accent-mist-cyan-text'
            />
            Remember for “{item.name}”
          </label>
        </div>
      )}
    </li>
  );
};

// What goes in the cart, editable before it's added
export const ReviewList = ({
  review,
  edit,
}: {
  review: Review;
  edit: ReturnType<typeof useEditLine>;
}) => (
  <section className={cn(cardClass, 'flex flex-col px-4 py-1')}>
    <h2 className='sr-only'>To add</h2>
    <ul className='m-0 list-none p-0'>
      {review.items.map((item) => (
        <ReviewRow
          key={item.lineId}
          item={item}
          saving={edit.isPending && edit.variables?.lineId === item.lineId}
          locked={edit.isPending}
          edit={(change, onSuccess) =>
            edit.mutate({ lineId: item.lineId, ...change }, { onSuccess })
          }
        />
      ))}
    </ul>
    {review.skipped.length > 0 && (
      <p className='my-3 text-[13px] font-medium text-mist-muted'>
        Skipped: {review.skipped.join(', ')}
      </p>
    )}
    <div className={cn(edit.error && 'pb-3')}>
      <ErrorText error={edit.error} />
    </div>
  </section>
);
