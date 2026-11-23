import Link from 'next/link';
import { type FormEvent, useEffect, useState } from 'react';
import { IconPicker } from '@/components/remorse-chess/IconPicker';
import {
  BoardThemePicker,
  PieceSetPicker,
} from '@/components/remorse-chess/BoardLookPickers';
import { BoardPreview } from '@/components/remorse-chess/BoardPreview';
import { PlayerPreview } from '@/components/remorse-chess/PlayerPreview';
import { RemorseLayout } from '@/components/remorse-chess/RemorseLayout';
import {
  useProfile,
  useUpdateProfile,
} from '@/components/remorse-chess/useGame';
import { useBoardLook } from '@/components/remorse-chess/useBoardLook';
import type { PlayerIcon } from '@/lib/remorse/icons';
import { cn } from '@/lib/utils';
import { buttonMd, goldButton } from '@/components/remorse-chess/buttons';
import { requireLogin } from '@/services/auth';

const primary = cn(goldButton, buttonMd);

const ProfilePage = ({ email }: { email: string }) => {
  const profile = useProfile();
  const update = useUpdateProfile();
  const lookUpdate = useUpdateProfile();
  const savedLook = useBoardLook();
  // while a choice saves, show it rather than the last saved one
  const pending = lookUpdate.isPending ? lookUpdate.variables : undefined;
  const pieceSet = pending?.pieceSet ?? savedLook.pieceSet;
  const board = pending?.boardTheme ?? savedLook.boardTheme;
  const [username, setUsername] = useState('');
  const [icon, setIcon] = useState<PlayerIcon | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!profile.data) return;
    setUsername(profile.data.username);
    setIcon(profile.data.icon);
  }, [profile.data]);

  const nameChanged =
    profile.data !== undefined && username.trim() !== profile.data.username;
  const iconChanged = profile.data !== undefined && icon !== profile.data.icon;
  const changed = nameChanged || iconChanged;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setSaved(false);
    update.mutate(
      {
        ...(nameChanged && { username: username.trim() }),
        ...(iconChanged && icon && { icon }),
      },
      { onSuccess: () => setSaved(true) },
    );
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
        <div>
          <h1 className='text-[clamp(24px,4vw,30px)] leading-tight font-bold tracking-tight text-white'>
            Profile
          </h1>
          <p className='truncate text-[13.5px] text-[#a29e96]'>
            Signed in as {email}
          </p>
        </div>

        <form
          onSubmit={submit}
          className='flex flex-col gap-3 rounded-xl bg-[#262421] p-4'
        >
          <PlayerPreview icon={icon} username={username} />
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
            3 to 20 letters, numbers, dashes or underscores.
          </p>
          <span className='mt-1 font-semibold text-white'>Icon</span>
          <IconPicker
            value={icon}
            onChange={(next) => {
              setIcon(next);
              setSaved(false);
            }}
            disabled={!profile.data || update.isPending}
          />
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

        <section className='flex flex-col gap-3 rounded-xl bg-[#262421] p-4'>
          <div className='flex items-center justify-between gap-3'>
            <h2 className='font-semibold text-white'>Board</h2>
            <div className='flex items-center gap-3'>
              {lookUpdate.isPending && (
                <span className='text-sm text-[#a29e96]'>Saving…</span>
              )}
              <BoardPreview pieceSet={pieceSet} board={board} />
            </div>
          </div>
          <span className='font-semibold text-white'>Pieces</span>
          <PieceSetPicker
            value={pieceSet}
            boardTheme={board}
            onChange={(next) => lookUpdate.mutate({ pieceSet: next })}
            disabled={!profile.data || lookUpdate.isPending}
          />
          <span className='mt-1 font-semibold text-white'>Colors</span>
          <BoardThemePicker
            value={board}
            onChange={(next) => lookUpdate.mutate({ boardTheme: next })}
            disabled={!profile.data || lookUpdate.isPending}
          />
          {lookUpdate.isError && (
            <p className='text-sm text-red-300'>{lookUpdate.error.message}</p>
          )}
        </section>
      </div>
    </RemorseLayout>
  );
};

export const getServerSideProps = requireLogin('remorse-chess');

export default ProfilePage;
