import { Minus, Plus, Search, SkipForward } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import { cn } from '@/lib/utils';
import type { PickChoice, Question, Reply } from '@/types/giantOrder';
import { primaryButton, secondaryButton } from './styles';
import { useAnswer } from './useGiant';

type Answer = (reply: Reply) => void;

const QuantityStepper = ({
  initial,
  pending,
  onSave,
}: {
  initial: number;
  pending: boolean;
  onSave: (quantity: number) => void;
}) => {
  const [quantity, setQuantity] = useState(initial);
  const stepClass =
    'flex size-11 cursor-pointer items-center justify-center rounded-full border border-mist-line bg-mist-surface disabled:cursor-default disabled:opacity-40';
  return (
    <div className='flex flex-col gap-3'>
      <div className='flex items-center justify-center gap-5'>
        <button
          type='button'
          aria-label='Fewer'
          className={stepClass}
          disabled={quantity <= 1}
          onClick={() => setQuantity(quantity - 1)}
        >
          <Minus size={18} aria-hidden />
        </button>
        <span className='min-w-10 text-center text-[28px] font-extrabold tabular-nums'>
          {quantity}
        </span>
        <button
          type='button'
          aria-label='More'
          className={stepClass}
          onClick={() => setQuantity(quantity + 1)}
        >
          <Plus size={18} aria-hidden />
        </button>
      </div>
      <button
        type='button'
        className={primaryButton}
        disabled={pending}
        onClick={() => onSave(quantity)}
      >
        Save {quantity}
      </button>
    </div>
  );
};

const ProductChoice = ({
  choice,
  pending,
  answer,
}: {
  choice: PickChoice;
  pending: boolean;
  answer: Answer;
}) => (
  <button
    type='button'
    disabled={pending || !!choice.disabled}
    onClick={() => answer(choice.value)}
    className={cn(
      'flex w-full cursor-pointer items-center gap-2 rounded-xl border border-mist-line bg-mist-surface px-3 py-2.5 text-left text-sm font-semibold disabled:cursor-default',
      choice.disabled ? 'text-mist-muted' : 'hover:border-mist-cyan-line',
    )}
  >
    <span className='flex-1'>{choice.name}</span>
    {choice.disabled && (
      <span className='shrink-0 rounded-full bg-mist-warn-banner px-2 py-0.5 text-[11px] font-bold text-mist-warn-text'>
        {choice.disabled}
      </span>
    )}
  </button>
);

const PickChoices = ({
  choices,
  pending,
  answer,
}: {
  choices: PickChoice[];
  pending: boolean;
  answer: Answer;
}) => {
  const products = choices.filter(({ value }) => value.kind === 'product');
  const others = choices.filter(({ value }) => value.kind !== 'product');
  return (
    <div className='flex flex-col gap-2'>
      {products.map((choice) => (
        <ProductChoice
          key={choice.name}
          choice={choice}
          pending={pending}
          answer={answer}
        />
      ))}
      <div className='flex gap-2'>
        {others.map(({ name, value }) => (
          <button
            key={name}
            type='button'
            disabled={pending}
            onClick={() => answer(value)}
            className={cn(
              secondaryButton,
              'h-auto min-h-11 flex-1 px-3 py-2 text-[13px] leading-4',
            )}
          >
            {value.kind === 'search' ? (
              <Search size={15} aria-hidden />
            ) : (
              <SkipForward size={15} aria-hidden />
            )}
            {name}
          </button>
        ))}
      </div>
    </div>
  );
};

const SearchForm = ({
  initial,
  pending,
  answer,
}: {
  initial: string;
  pending: boolean;
  answer: Answer;
}) => {
  const [text, setText] = useState(initial);
  const [error, setError] = useState(false);
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!text.trim()) return setError(true);
    answer({ kind: 'text', text });
  };
  return (
    <form onSubmit={submit} className='flex flex-col gap-1'>
      <div className='flex gap-2'>
        <input
          value={text}
          onChange={(event) => {
            setText(event.target.value);
            setError(false);
          }}
          placeholder='turkey breast deli'
          className='h-11 min-w-0 flex-1 rounded-[14px] border border-mist-line bg-mist-surface px-3 text-[15px]'
        />
        <button
          type='submit'
          aria-label='Search'
          disabled={pending}
          className={cn(primaryButton, 'px-4')}
        >
          <Search size={18} aria-hidden />
        </button>
      </div>
      {error && (
        <p className='m-0 text-[13px] text-mist-pink-text'>
          Enter something to search for
        </p>
      )}
    </form>
  );
};

// The list's one open question, shown under its line
export const QuestionPanel = ({
  question,
  initialQuantity,
}: {
  question: Question;
  // For a total: what the merged lines add up to
  initialQuantity: number;
}) => {
  const { mutate, isPending, error } = useAnswer();

  const body = () => {
    switch (question.kind) {
      case 'pick':
        return (
          <PickChoices
            choices={question.choices}
            pending={isPending}
            answer={mutate}
          />
        );
      case 'searchText':
        return (
          <SearchForm
            initial={question.initial}
            pending={isPending}
            answer={mutate}
          />
        );
      case 'remember':
        return (
          <div className='flex gap-2'>
            <button
              type='button'
              disabled={isPending}
              className={cn(primaryButton, 'flex-1')}
              onClick={() => mutate({ kind: 'confirm', yes: true })}
            >
              Remember
            </button>
            <button
              type='button'
              disabled={isPending}
              className={cn(secondaryButton, 'flex-1')}
              onClick={() => mutate({ kind: 'confirm', yes: false })}
            >
              Just this time
            </button>
          </div>
        );
      case 'quantity':
      case 'total':
        return (
          <QuantityStepper
            initial={initialQuantity}
            pending={isPending}
            onSave={(quantity) => mutate({ kind: 'quantity', quantity })}
          />
        );
    }
  };

  return (
    <div className='flex flex-col gap-3 rounded-2xl border-2 border-mist-cyan-line bg-mist-raised p-3'>
      <p className='m-0 text-[15px] leading-6 font-semibold'>
        {question.message}
      </p>
      {body()}
      {isPending && (
        <p className='m-0 text-[13px] font-medium text-mist-muted'>Saving…</p>
      )}
      {error && (
        <p className='m-0 text-[13px] font-medium text-mist-pink-text'>
          {error.message}
        </p>
      )}
    </div>
  );
};
