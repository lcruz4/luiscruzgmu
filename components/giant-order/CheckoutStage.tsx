import { CalendarClock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type {
  CheckoutChoice,
  CheckoutQuestion,
  CheckoutReply,
  CheckoutResult,
} from '@/types/giantOrder';
import { cardClass, primaryButton, secondaryButton } from './styles';
import { useAnswerCheckout, useCancelCheckout } from './useGiant';

type Answer = (reply: CheckoutReply) => void;

const ChoiceGrid = ({
  choices,
  pending,
  answer,
}: {
  choices: CheckoutChoice[];
  pending: boolean;
  answer: Answer;
}) => (
  <div className='grid grid-cols-2 gap-2'>
    {choices.map(({ name, value }) => (
      <button
        key={name}
        type='button'
        disabled={pending}
        onClick={() => answer(value)}
        className={cn(secondaryButton, 'h-auto min-h-11 px-3 py-2 text-sm')}
      >
        {name}
      </button>
    ))}
  </div>
);

const PlaceOrder = ({
  question,
  pending,
  answer,
}: {
  question: Extract<CheckoutQuestion, { kind: 'place' }>;
  pending: boolean;
  answer: Answer;
}) => (
  <>
    <pre className='m-0 overflow-x-auto rounded-xl bg-mist-raised p-3 font-ui text-[13px] leading-6 font-medium whitespace-pre-wrap'>
      {/* Indented for the terminal */}
      {question.details.replace(/^ {2}/gm, '')}
    </pre>
    <div className='flex flex-col gap-2'>
      {question.choices.map(({ name, value }) => (
        <button
          key={name}
          type='button'
          disabled={pending}
          onClick={() => answer(value)}
          className={cn(
            value.kind === 'final' && value.choice === 'place'
              ? primaryButton
              : secondaryButton,
            'h-auto min-h-11 py-2',
          )}
        >
          {name}
        </button>
      ))}
    </div>
  </>
);

const QuestionBody = ({
  question,
  pending,
  answer,
}: {
  question: CheckoutQuestion;
  pending: boolean;
  answer: Answer;
}) => {
  switch (question.kind) {
    case 'offer':
      return (
        <div className='flex flex-col gap-2'>
          <button
            type='button'
            disabled={pending}
            className={primaryButton}
            onClick={() => answer({ kind: 'confirm', yes: true })}
          >
            Use this slot
          </button>
          <button
            type='button'
            disabled={pending}
            className={secondaryButton}
            onClick={() => answer({ kind: 'confirm', yes: false })}
          >
            Pick another time
          </button>
        </div>
      );
    case 'place':
      return (
        <PlaceOrder question={question} pending={pending} answer={answer} />
      );
    default:
      return (
        <ChoiceGrid
          choices={question.choices}
          pending={pending}
          answer={answer}
        />
      );
  }
};

export const CheckoutStage = ({
  question,
  onResult,
}: {
  question: CheckoutQuestion;
  onResult: (result: CheckoutResult) => void;
}) => {
  const answer = useAnswerCheckout();
  const cancel = useCancelCheckout();
  const pending = answer.isPending || cancel.isPending;
  const note = 'note' in question ? question.note : null;
  const error = answer.error ?? cancel.error;
  const reply = (value: CheckoutReply) =>
    answer.mutate(value, {
      onSuccess: (data) => {
        if (data.result) onResult(data.result);
      },
    });

  return (
    <>
      <header className='flex items-center justify-between'>
        <h1 className='m-0 text-[22px] font-extrabold'>Checkout</h1>
        {question.kind !== 'place' && (
          <button
            type='button'
            onClick={() => cancel.mutate()}
            disabled={pending}
            className='cursor-pointer text-[13px] font-bold text-mist-cyan-text'
          >
            Cancel
          </button>
        )}
      </header>
      <section className={cn(cardClass, 'flex flex-col gap-3 p-4')}>
        <div className='flex items-start gap-3'>
          <CalendarClock
            size={20}
            className='mt-0.5 shrink-0 text-mist-cyan-text'
            aria-hidden
          />
          <div className='flex flex-col gap-0.5'>
            <p className='m-0 text-[17px] font-bold'>{question.message}</p>
            {note && (
              <p className='m-0 text-[13px] font-medium text-mist-muted'>
                {note}
              </p>
            )}
          </div>
        </div>
        <QuestionBody question={question} pending={pending} answer={reply} />
        {answer.isPending && (
          <p className='m-0 text-[13px] font-medium text-mist-muted'>
            Working…
          </p>
        )}
        {error && (
          <p className='m-0 text-[13px] font-medium text-mist-pink-text'>
            {error.message}
          </p>
        )}
      </section>
    </>
  );
};
