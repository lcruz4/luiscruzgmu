import { onlineManager } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { saveErrorText } from './useLogMutations';

interface SaveStatusProps {
  error: Error | null;
  /** Offline, or queued behind an earlier write to the same log */
  paused: boolean;
  onRetry: () => void;
  className?: string;
}

const textClass = 'm-0 text-[13px] font-semibold text-mist-warn-text';

export const SaveStatus = ({
  error,
  paused,
  onRetry,
  className,
}: SaveStatusProps) => {
  if (paused && !onlineManager.isOnline()) {
    return (
      <p role='status' className={cn(textClass, className)}>
        Waiting for a connection…
      </p>
    );
  }
  if (!error) return null;
  return (
    <div
      role='alert'
      className={cn(textClass, 'flex items-center gap-1', className)}
    >
      <span>{saveErrorText(error)}</span>
      <button
        type='button'
        onClick={onRetry}
        className='h-11 cursor-pointer px-2 font-bold underline'
      >
        Retry
      </button>
    </div>
  );
};
