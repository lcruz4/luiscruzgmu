import { LoaderCircle, Search } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import { cn } from '@/lib/utils';
import type { SearchProduct } from '@/types/giantOrder';
import { ProductThumb } from './ProductThumb';
import { inputClass, money, primaryButton } from './styles';
import { useSearch } from './useGiant';

export const ErrorText = ({ error }: { error: Error | null }) =>
  error && (
    <p className='m-0 text-[13px] font-medium text-mist-pink-text'>
      {error.message}
    </p>
  );

// Searches Giant (opens a tab on the Mac) for a product
export const ProductSearch = ({
  initial,
  onPick,
}: {
  initial: string;
  onPick: (product: SearchProduct) => void;
}) => {
  const [text, setText] = useState(initial);
  const [query, setQuery] = useState('');
  const search = useSearch(query);
  const submit = (event: FormEvent) => {
    event.preventDefault();
    setQuery(text.trim());
  };
  return (
    <div className='flex flex-col gap-2'>
      <form onSubmit={submit} className='flex gap-2'>
        <input
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder='Search Giant'
          className={cn(inputClass, 'flex-1')}
        />
        <button
          type='submit'
          aria-label='Search'
          disabled={search.isFetching}
          className={cn(primaryButton, 'px-4')}
        >
          {search.isFetching ? (
            <LoaderCircle size={18} className='animate-spin' aria-hidden />
          ) : (
            <Search size={18} aria-hidden />
          )}
        </button>
      </form>
      {search.data?.length === 0 && (
        <p className='m-0 text-[13px] font-medium text-mist-muted'>
          No products found
        </p>
      )}
      {search.data?.map((product) => (
        <button
          key={product.prodId}
          type='button'
          onClick={() => onPick(product)}
          className='flex w-full cursor-pointer items-center gap-3 rounded-xl border border-mist-line bg-mist-surface px-3 py-2 text-left hover:border-mist-cyan-line'
        >
          <ProductThumb product={product} className='size-12' />
          <span className='flex min-w-0 flex-1 flex-col'>
            <span className='text-sm font-semibold'>{product.name}</span>
            <span className='text-[13px] font-medium text-mist-muted'>
              {product.size} · {money(product.price)}
              {product.boughtBefore && ' · bought before'}
            </span>
          </span>
          {product.unavailable && (
            <span className='shrink-0 rounded-full bg-mist-warn-banner px-2 py-0.5 text-[11px] font-bold text-mist-warn-text'>
              {product.unavailable}
            </span>
          )}
        </button>
      ))}
      <ErrorText error={search.error} />
    </div>
  );
};
