import { Clock, Dumbbell, List } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { cn } from '@/lib/utils';

const TABS = [
  { href: '/projects/workout-tracker', label: 'Log', Icon: Dumbbell },
  { href: '/projects/workout-tracker/history', label: 'History', Icon: Clock },
  { href: '/projects/workout-tracker/plan', label: 'Plan', Icon: List },
];

export const TabBar = () => {
  const { pathname } = useRouter();
  return (
    <nav
      aria-label='Workout tracker'
      className='sticky bottom-0 grid grid-cols-3 border-t border-mist-line bg-mist-surface px-2 pt-1 pb-[max(12px,env(safe-area-inset-bottom))]'
    >
      {TABS.map(({ href, label, Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex flex-col items-center gap-1 border-t-2 py-2 text-xs font-bold',
              active
                ? 'border-mist-cyan-line text-mist-cyan-text'
                : 'border-transparent text-mist-muted',
            )}
          >
            <Icon size={24} strokeWidth={2} aria-hidden />
            {label}
          </Link>
        );
      })}
    </nav>
  );
};
