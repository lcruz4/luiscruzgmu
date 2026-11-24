import Link from 'next/link';
import type { ReactNode } from 'react';
import { playerPath } from '@/lib/remorse/paths';
import { cn } from '@/lib/utils';

// A player's name, linking to their page. Sits above a row's stretched game
// link (see GameLink) so both stay clickable.
export const PlayerLink = ({
  id,
  className,
  children,
}: {
  id: number | null;
  className?: string;
  children: ReactNode;
}) =>
  id === null ? (
    <span className={className}>{children}</span>
  ) : (
    <Link
      href={playerPath(id)}
      className={cn(
        'relative z-10 underline-offset-2 hover:underline',
        className,
      )}
    >
      {children}
    </Link>
  );

// Makes a whole row open the game: the link's box stretches over its nearest
// `relative` ancestor, beneath any PlayerLink
export const stretchedLink = "after:absolute after:inset-0 after:content-['']";
