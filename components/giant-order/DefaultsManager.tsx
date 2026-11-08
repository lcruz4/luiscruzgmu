import { LoaderCircle, Plus } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import { cn } from '@/lib/utils';
import type {
  DefaultChange,
  ItemDefault,
  SearchProduct,
} from '@/types/giantOrder';
import { ErrorText, ProductSearch } from './ProductSearch';
import { ProductThumb } from './ProductThumb';
import {
  cardClass,
  inputClass,
  labelClass,
  linkButton,
  primaryButton,
  secondaryButton,
} from './styles';
import { Unreachable } from './Unreachable';
import {
  isUnreachable,
  useDefaults,
  useDeleteDefault,
  usePutDefault,
} from './useGiant';

// Edits `entry`, or adds a new alias without one. Only changed fields are sent.
const DefaultForm = ({
  entry,
  onDone,
}: {
  entry?: ItemDefault;
  onDone: () => void;
}) => {
  const [alias, setAlias] = useState(entry?.alias ?? '');
  const [picked, setPicked] = useState<SearchProduct | null>(null);
  const [searching, setSearching] = useState(!entry);
  const [note, setNote] = useState(entry?.note ?? '');
  const [invalid, setInvalid] = useState<string | null>(null);
  const put = usePutDefault();
  const remove = useDeleteDefault();

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!alias.trim()) return setInvalid('Enter the list name');
    if (!entry && !picked) return setInvalid('Pick a product');
    const savedNote = note.trim() || null;
    const change: DefaultChange = {};
    if (picked && picked.prodId !== entry?.prodId) {
      change.prodId = picked.prodId;
    }
    if (savedNote !== (entry?.note ?? null)) change.note = savedNote;
    if (Object.keys(change).length === 0) return onDone();
    put.mutate({ alias, change }, { onSuccess: onDone });
  };

  const deleteEntry = () => {
    if (entry && window.confirm(`Delete "${entry.alias}"?`)) {
      remove.mutate(entry.alias, { onSuccess: onDone });
    }
  };

  const pending = put.isPending || remove.isPending;
  return (
    <div className='flex flex-col gap-3 rounded-2xl border-2 border-mist-cyan-line bg-mist-raised p-3'>
      {!entry && (
        <label className='flex flex-col gap-1'>
          <span className={labelClass}>List name</span>
          <input
            value={alias}
            onChange={(event) => {
              setAlias(event.target.value);
              setInvalid(null);
            }}
            placeholder='black beans'
            className={inputClass}
          />
        </label>
      )}
      <div className='flex flex-col gap-1'>
        <span className={labelClass}>Product</span>
        {picked ? (
          <div className='flex items-center gap-3'>
            <ProductThumb product={picked} />
            <span className='text-sm font-semibold'>
              {picked.name} · {picked.size}
            </span>
          </div>
        ) : (
          entry && (
            <span className='text-sm font-semibold'>{entry.product}</span>
          )
        )}
        {searching ? (
          <ProductSearch
            initial={alias}
            onPick={(product) => {
              setPicked(product);
              setSearching(false);
              setInvalid(null);
            }}
          />
        ) : (
          <button
            type='button'
            onClick={() => setSearching(true)}
            className={cn(linkButton, 'self-start')}
          >
            Change product
          </button>
        )}
      </div>
      <form onSubmit={submit} className='flex flex-col gap-3'>
        <label className='flex flex-col gap-1'>
          <span className={labelClass}>Note</span>
          <input
            value={note}
            onChange={(event) => setNote(event.target.value)}
            className={inputClass}
          />
        </label>
        {invalid && (
          <p className='m-0 text-[13px] text-mist-pink-text'>{invalid}</p>
        )}
        <div className='flex gap-2'>
          <button
            type='submit'
            disabled={pending}
            className={cn(primaryButton, 'flex-1')}
          >
            {put.isPending ? 'Saving…' : 'Save'}
          </button>
          <button
            type='button'
            disabled={pending}
            onClick={onDone}
            className={cn(secondaryButton, 'flex-1')}
          >
            Cancel
          </button>
        </div>
        {entry && (
          <button
            type='button'
            disabled={pending}
            onClick={deleteEntry}
            className={cn(linkButton, 'self-center text-mist-pink-text')}
          >
            {remove.isPending ? 'Deleting…' : 'Delete'}
          </button>
        )}
        <ErrorText error={put.error ?? remove.error} />
      </form>
    </div>
  );
};

// giant-cart's item_defaults: what each list name means
export const DefaultsManager = () => {
  const defaults = useDefaults();
  const [filter, setFilter] = useState('');
  // An alias, or '' for a new one
  const [editing, setEditing] = useState<string | null>(null);

  if (isUnreachable(defaults.error)) {
    return (
      <Unreachable
        checking={defaults.isFetching}
        onRetry={() => defaults.refetch()}
      />
    );
  }
  const words = filter.trim().toLowerCase();
  const shown = (defaults.data ?? []).filter(
    (entry) =>
      !words ||
      entry.alias.includes(words) ||
      entry.product.toLowerCase().includes(words),
  );
  return (
    <>
      <header className='flex items-center justify-between'>
        <h1 className='m-0 text-[22px] font-extrabold'>Defaults</h1>
        {editing !== '' && (
          <button
            type='button'
            onClick={() => setEditing('')}
            className={linkButton}
          >
            <Plus size={15} aria-hidden />
            Add
          </button>
        )}
      </header>
      {editing === '' && <DefaultForm onDone={() => setEditing(null)} />}
      <input
        value={filter}
        onChange={(event) => setFilter(event.target.value)}
        placeholder='Filter'
        aria-label='Filter defaults'
        className={inputClass}
      />
      {defaults.isPending && (
        <div className='flex justify-center text-mist-muted'>
          <LoaderCircle
            size={24}
            className='animate-spin'
            aria-label='Loading'
          />
        </div>
      )}
      <ErrorText error={defaults.error} />
      {defaults.data && (
        <section className={cn(cardClass, 'px-4 py-1')}>
          <h2 className='sr-only'>Defaults</h2>
          {shown.length === 0 && (
            <p className='my-3 text-sm font-medium text-mist-muted'>
              No defaults
            </p>
          )}
          <ul className='m-0 list-none p-0'>
            {shown.map((entry) => (
              <li
                key={entry.alias}
                className='flex flex-col gap-2 border-b border-mist-line py-3 last:border-b-0'
              >
                <button
                  type='button'
                  onClick={() =>
                    setEditing(editing === entry.alias ? null : entry.alias)
                  }
                  className='flex w-full cursor-pointer items-center gap-3 text-left'
                >
                  <span className='flex min-w-0 flex-1 flex-col'>
                    <span className='text-[15px] font-bold'>{entry.alias}</span>
                    <span className='text-[13px] font-medium text-mist-muted'>
                      {entry.product}
                      {entry.note && ` · ${entry.note}`}
                    </span>
                  </span>
                  {entry.status === 'review' && (
                    <span className='shrink-0 rounded-full bg-mist-warn-banner px-2 py-0.5 text-[11px] font-bold text-mist-warn-text'>
                      review
                    </span>
                  )}
                </button>
                {editing === entry.alias && (
                  <DefaultForm
                    key={entry.alias}
                    entry={entry}
                    onDone={() => setEditing(null)}
                  />
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
};
