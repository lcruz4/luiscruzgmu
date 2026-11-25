import { cn } from '@/lib/utils';

// A player's rating beside their name
export const Rating = ({
  rating,
  className,
}: {
  rating: number | null | undefined;
  className?: string;
}) =>
  rating === null || rating === undefined ? null : (
    <span
      className={cn(
        'flex-none font-normal text-[#a29e96] tabular-nums',
        className,
      )}
    >
      ({rating})
    </span>
  );
