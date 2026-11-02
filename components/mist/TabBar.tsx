import { LogOut, type LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { authLogoutUrl } from '@/lib/auth';
import { cn } from '@/lib/utils';

export type Tab = { href: string; label: string; Icon: LucideIcon };

const tabClass =
  'flex flex-col items-center gap-1 border-t-2 py-2 text-xs font-bold';

// Bottom tab bar for the mist-themed project apps, with a log out button last.
// Logging out lands on `home`, whose login check sends it to sign-in.
export const TabBar = ({
  label,
  tabs,
  home,
}: {
  label: string;
  tabs: Tab[];
  home: string;
}) => {
  const { pathname } = useRouter();
  const logOut = () => {
    window.location.href = authLogoutUrl(`${window.location.origin}${home}`);
  };
  return (
    <nav
      aria-label={label}
      style={{ gridTemplateColumns: `repeat(${tabs.length + 1}, 1fr)` }}
      className='sticky bottom-0 grid border-t border-mist-line bg-mist-surface px-2 pt-1 pb-[max(12px,env(safe-area-inset-bottom))]'
    >
      {tabs.map(({ href, label: tabLabel, Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              tabClass,
              active
                ? 'border-mist-cyan-line text-mist-cyan-text'
                : 'border-transparent text-mist-muted',
            )}
          >
            <Icon size={24} strokeWidth={2} aria-hidden />
            {tabLabel}
          </Link>
        );
      })}
      <button
        type='button'
        onClick={logOut}
        className={cn(
          tabClass,
          'cursor-pointer border-transparent text-mist-muted',
        )}
      >
        <LogOut size={24} strokeWidth={2} aria-hidden />
        Log out
      </button>
    </nav>
  );
};
