import { List } from 'lucide-react';
import Link from 'next/link';
import { labelClass } from './styles';

export const NoPlan = ({ email }: { email: string }) => (
  <main className='flex flex-1 flex-col items-center justify-center gap-6 px-6 py-8 text-center'>
    <div className='flex size-[72px] items-center justify-center rounded-full border-2 border-dashed border-mist-dashed text-mist-muted'>
      <List size={32} strokeWidth={2} aria-hidden />
    </div>
    <div className='flex max-w-sm flex-col gap-2'>
      <h1 className='m-0 text-[26px] leading-8 font-extrabold'>No plan yet</h1>
      <p className='m-0 text-base leading-6 font-medium text-balance text-mist-muted'>
        This account doesn’t have an active workout plan, so there’s nothing to
        log yet.
      </p>
      <p className='m-0 text-base leading-6 font-medium text-balance text-mist-muted'>
        To request a free plan, email
        <a
          href='mailto:workouttrackerrequest@lcruz.dev'
          className='block font-bold break-all text-mist-cyan-text underline underline-offset-4'
        >
          workouttrackerrequest@lcruz.dev
        </a>
      </p>
    </div>
    <div className='flex flex-col gap-0.5 self-stretch rounded-[14px] border border-mist-line bg-mist-surface px-4 py-3.5 text-left'>
      <span className={labelClass}>Signed in as</span>
      <span className='text-[15px] font-bold break-words'>{email}</span>
    </div>
    <Link href='/' className='text-sm font-bold text-mist-cyan-text'>
      Back to lcruz.dev
    </Link>
  </main>
);
