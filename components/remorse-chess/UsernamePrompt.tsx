import { type FormEvent, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { buttonMd, ghostButton, goldButton } from './buttons';
import type { PlayerIcon } from '@/lib/remorse/icons';
import { IconPicker } from './IconPicker';
import { PlayerPreview } from './PlayerPreview';
import { useProfile, useUpdateProfile } from './useGame';

// Asks a new player to pick a name once. Closing it keeps the default (their
// email before the @) and stops it asking again.
export const UsernamePrompt = () => {
  const profile = useProfile();
  const update = useUpdateProfile();
  const [username, setUsername] = useState<string | null>(null);
  const [icon, setIcon] = useState<PlayerIcon | undefined>();

  if (!profile.data || profile.data.chosen) return null;
  const value = username ?? profile.data.username;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    update.mutate({ username: value.trim(), icon });
  };

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !update.isPending) update.mutate({ username: null });
      }}
    >
      <DialogContent className='max-w-[calc(100%-32px)] gap-0 font-sans rounded-2xl border-[#3a3733] bg-[#262421] p-5 text-[#e8e6e1] sm:max-w-md sm:rounded-2xl [&>button]:text-[#a29e96]'>
        <form onSubmit={submit} className='flex flex-col gap-3'>
          <div className='pr-6'>
            <DialogTitle className='text-xl font-bold text-white'>
              Pick a name and icon
            </DialogTitle>
            <DialogDescription className='text-[13.5px] text-[#a29e96]'>
              Opponents see these instead of your email. You can change it later
              on your profile.
            </DialogDescription>
          </div>
          <PlayerPreview icon={icon ?? profile.data.icon} username={value} />
          <input
            value={value}
            onChange={(event) => setUsername(event.target.value)}
            maxLength={20}
            autoFocus
            autoComplete='username'
            autoCapitalize='none'
            spellCheck={false}
            aria-label='Username'
            className={cn(
              'rounded-lg border-2 border-[#514d47] bg-[#161512] px-3 py-2 text-white outline-none focus:border-[#c98a1c]',
              update.isError && 'border-red-400/70',
            )}
          />
          <p className='text-[13px] text-[#a29e96]'>
            3 to 20 letters, numbers, dashes or underscores.
          </p>
          <span className='mt-1 text-sm font-semibold text-white'>
            Your icon
          </span>
          <IconPicker
            value={icon ?? profile.data.icon}
            onChange={setIcon}
            disabled={update.isPending}
          />
          {update.isError && (
            <p className='text-sm text-red-300'>{update.error.message}</p>
          )}
          <div className='flex flex-wrap justify-end gap-2'>
            <button
              type='button'
              className={cn(ghostButton, buttonMd)}
              disabled={update.isPending}
              onClick={() => update.mutate({ username: null, icon })}
            >
              Keep {profile.data.username}
            </button>
            <button
              type='submit'
              className={cn(goldButton, buttonMd)}
              disabled={update.isPending}
            >
              Save
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
