import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { buttonMd, ghostButton, goldButton } from './buttons';
import {
  DEPLOY_KEY,
  type DeployStatus,
  isDeployingError,
  useDeployStatus,
  useNotifyDeployDone,
} from './useGame';
import { BELL_SRC, pushSupported, subscribe } from './useYourMoveAlerts';

// Asks for push permission from the tap (iOS only prompts from one); the
// in-page notice still works without it
const allowPush = async () => {
  if (!pushSupported()) return;
  const permission =
    Notification.permission === 'default'
      ? await Notification.requestPermission()
      : Notification.permission;
  if (permission === 'granted') await subscribe();
};

// Opens when the server refuses a live game because a deploy is running.
// "Notify me" gets a push when it's done; with the page open, this dialog
// also comes back to say so.
export const DeployDialog = () => {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const status = useDeployStatus(open);
  const notify = useNotifyDeployDone();
  const deploying = status.data?.deploying ?? true;
  const notifying = status.data?.notifying ?? false;
  const wasNotifying = useRef(false);

  useEffect(
    () =>
      queryClient.getMutationCache().subscribe((event) => {
        if (
          event.type === 'updated' &&
          event.action.type === 'error' &&
          isDeployingError(event.action.error)
        ) {
          // The server just said so; don't show a stale "done" meanwhile
          queryClient.setQueryData<DeployStatus>(DEPLOY_KEY, (old) => ({
            deploying: true,
            notifying: old?.notifying ?? false,
          }));
          setOpen(true);
        }
      }),
    [queryClient],
  );

  // The deploy finished while waiting: say so here too
  useEffect(() => {
    if (notifying) wasNotifying.current = true;
    if (!deploying && wasNotifying.current) {
      wasNotifying.current = false;
      setOpen(true);
      new Audio(BELL_SRC).play().catch(() => undefined);
    }
  }, [deploying, notifying]);

  const onNotify = async () => {
    await allowPush().catch(() => undefined);
    notify.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className='max-w-[calc(100%-32px)] gap-0 rounded-2xl border-[#3a3733] bg-[#262421] p-5 font-sans text-[#e8e6e1] sm:max-w-md sm:rounded-2xl [&>button]:text-[#a29e96]'>
        <DialogTitle className='mb-1.5 text-lg font-bold text-white'>
          {deploying ? 'Update in progress' : 'Live games are back'}
        </DialogTitle>
        <DialogDescription className='text-[14px] leading-snug text-[#a29e96]'>
          {deploying
            ? 'An update is going out, and games can lag while it does, so live games are off until it’s done. Daily games still work.'
            : 'The update is done. Start a live game whenever you’re ready.'}
        </DialogDescription>
        {deploying && notifying && (
          <p className='mt-3 text-[14px] text-[#ffd27a]'>
            We’ll notify you when it’s done.
          </p>
        )}
        {notify.isError && (
          <p className='mt-3 text-sm text-red-300'>{notify.error.message}</p>
        )}
        <div className='mt-5 flex justify-end gap-2'>
          <button
            type='button'
            className={cn(ghostButton, buttonMd)}
            onClick={() => setOpen(false)}
          >
            {deploying && !notifying ? 'Not now' : 'OK'}
          </button>
          {deploying && !notifying && (
            <button
              type='button'
              className={cn(goldButton, buttonMd)}
              disabled={notify.isPending}
              onClick={onNotify}
            >
              Notify me when it’s done
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
