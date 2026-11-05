import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';

const buttonClass =
  'flex cursor-pointer items-center justify-center self-stretch rounded-[14px] border border-mist-line px-4 py-3.5 text-[15px] font-bold text-mist-cyan-text disabled:cursor-default disabled:opacity-60';

const inputClass =
  'h-12 w-full rounded-[12px] border border-mist-line bg-mist-raised px-3.5 text-[15px] font-medium text-mist-text outline-none placeholder:text-mist-muted focus:border-mist-cyan-line focus:ring-1 focus:ring-mist-cyan-line';

const sendRequest = async (email: string) => {
  const response = await fetch('/api/plan-request', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  if (!response.ok) throw new Error(`Request failed: ${response.status}`);
};

// Signed in → one click sends with their email; signed out → asks for one first
export const RequestPlan = ({ email }: { email?: string }) => {
  const [open, setOpen] = useState(false);
  const [typedEmail, setTypedEmail] = useState('');
  const request = useMutation({ mutationFn: sendRequest });

  if (request.isSuccess) {
    return (
      <p className='m-0 self-stretch rounded-[14px] border border-mist-line px-4 py-3.5 text-[15px] font-bold text-mist-cyan-text'>
        Request sent!
      </p>
    );
  }

  const error = request.isError && (
    <p className='m-0 text-sm font-medium text-mist-muted'>
      Couldn’t send the request. Try again.
    </p>
  );

  if (email) {
    return (
      <>
        <button
          type='button'
          disabled={request.isPending}
          onClick={() => request.mutate(email)}
          className={buttonClass}
        >
          {request.isPending ? 'Sending…' : 'Request a free plan'}
        </button>
        {error}
      </>
    );
  }

  if (!open) {
    return (
      <button
        type='button'
        onClick={() => setOpen(true)}
        className={buttonClass}
      >
        Request access to Workout Tracker
      </button>
    );
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        request.mutate(typedEmail);
      }}
      className='flex flex-col gap-2 self-stretch'
    >
      <input
        type='email'
        required
        autoFocus
        value={typedEmail}
        onChange={(event) => setTypedEmail(event.target.value)}
        placeholder='Your email'
        aria-label='Your email'
        className={inputClass}
      />
      <button
        type='submit'
        disabled={request.isPending}
        className={buttonClass}
      >
        {request.isPending ? 'Sending…' : 'Send request'}
      </button>
      {error}
    </form>
  );
};
