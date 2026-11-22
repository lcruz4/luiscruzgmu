import Link from 'next/link';
import { type FormEvent, useEffect, useState } from 'react';
import { Marker } from '@/components/remorse-chess/Marker';
import { RemorseLayout } from '@/components/remorse-chess/RemorseLayout';
import {
  useProfile,
  useUpdateProfile,
} from '@/components/remorse-chess/useGame';
import { cn } from '@/lib/utils';
import { requireLogin } from '@/services/auth';

const primary =
  'inline-flex cursor-pointer items-center justify-center rounded-[10px] border-2 border-[#120d0b] bg-linear-to-b from-[#ffd27a] to-[#c98a1c] px-4 py-2.5 text-[15px] font-semibold text-[#1a1209] shadow-[inset_0_1px_0_rgba(255,255,255,.5),0_2px_0_#120d0b] hover:brightness-105 disabled:cursor-default disabled:opacity-50';

const ProfilePage = ({ email }: { email: string }) => {
  const profile = useProfile();
  const update = useUpdateProfile();
  const [username, setUsername] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (profile.data) setUsername(profile.data.username);
  }, [profile.data]);

  const changed = username.trim() !== profile.data?.username;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setSaved(false);
    update.mutate(username.trim(), { onSuccess: () => setSaved(true) });
  };

  return (
    <RemorseLayout>
      <div className='mx-auto flex max-w-[520px] flex-col gap-6 pt-3 text-[15px] leading-relaxed'>
        <Link
          href='/projects/remorse-chess'
          className='text-sm text-[#a29e96] hover:text-white'
        >
          ← Your games
        </Link>
        <div className='flex items-center gap-3'>
          <Marker
            trauma='unaffected'
            healed={false}
            turnsLeft={0}
            kills={0}
            className='block h-[62px] w-[58px] flex-none'
          />
          <div className='min-w-0'>
            <h1 className='text-[clamp(24px,4vw,30px)] leading-tight font-bold tracking-tight text-white'>
              Profile
            </h1>
            <p className='truncate text-[13.5px] text-[#a29e96]'>
              Signed in as {email}
            </p>
          </div>
        </div>

        <form
          onSubmit={submit}
          className='flex flex-col gap-3 rounded-xl bg-[#262421] p-4'
        >
          <label htmlFor='username' className='font-semibold text-white'>
            Username
          </label>
          <input
            id='username'
            value={username}
            onChange={(event) => {
              setUsername(event.target.value);
              setSaved(false);
            }}
            disabled={!profile.data}
            maxLength={20}
            autoComplete='username'
            autoCapitalize='none'
            spellCheck={false}
            className={cn(
              'rounded-lg border-2 border-[#514d47] bg-[#161512] px-3 py-2 text-white outline-none focus:border-[#c98a1c]',
              update.isError && 'border-red-400/70',
            )}
          />
          <p className='text-[13px] text-[#a29e96]'>
            What opponents see in their games. 3 to 20 letters, numbers, dashes
            or underscores.
          </p>
          {update.isError && (
            <p className='text-sm text-red-300'>{update.error.message}</p>
          )}
          <div className='flex items-center gap-3'>
            <button
              type='submit'
              className={primary}
              disabled={!changed || update.isPending}
            >
              {update.isPending ? 'Saving…' : 'Save'}
            </button>
            {saved && !changed && (
              <span className='text-sm text-[#ffd27a]'>Saved</span>
            )}
          </div>
        </form>
      </div>
    </RemorseLayout>
  );
};

export const getServerSideProps = requireLogin('remorse-chess');

export default ProfilePage;
