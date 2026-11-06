import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronRight, LogOut, Menu, X } from 'lucide-react';
import { authLogoutUrl } from '@/lib/auth';

type NavItem = { label: string; href?: string; children?: NavItem[] };

const NAV: NavItem[] = [
  { label: 'Admin', href: '/admin' },
  { label: 'Chess review', href: '/projects/chess-review' },
  { label: 'Giant order tool', href: '/projects/giant-order-tool' },
  { label: 'Kuromasu', href: '/projects/kuromasu' },
  {
    label: 'Workout tracker',
    children: [
      { label: 'Log', href: '/projects/workout-tracker' },
      { label: 'History', href: '/projects/workout-tracker/history' },
      { label: 'Plan', href: '/projects/workout-tracker/plan' },
    ],
  },
];

const signOut = () => {
  window.location.href = authLogoutUrl(window.location.origin);
};

const MENU =
  'invisible absolute z-20 min-w-48 rounded-md border border-[#1e2a44] bg-[#0d1322] py-1 opacity-0 shadow-lg shadow-black/40 transition-opacity group-hover:visible group-hover:opacity-100';
const MENU_ITEM =
  'flex items-center justify-between gap-6 px-3 py-1.5 text-sm text-[#d6e2ff] hover:bg-[#22d3ee1a] hover:text-[#67e8f9]';

const MOBILE_ITEM =
  'block rounded px-2 py-2 text-sm text-[#d6e2ff] hover:bg-[#22d3ee1a] hover:text-[#67e8f9]';

const SubMenuItem = ({ item }: { item: NavItem }) => {
  if (!item.children) {
    return (
      <Link href={item.href ?? '#'} className={MENU_ITEM}>
        {item.label}
      </Link>
    );
  }
  return (
    <div className='group/sub relative'>
      <Link href={item.href ?? '#'} className={MENU_ITEM}>
        {item.label}
        <ChevronRight className='size-3.5 text-[#7b8bb0]' />
      </Link>
      <div className='invisible absolute top-0 left-full z-30 -mt-1 min-w-36 rounded-md border border-[#1e2a44] bg-[#0d1322] py-1 opacity-0 shadow-lg shadow-black/40 transition-opacity group-hover/sub:visible group-hover/sub:opacity-100'>
        {item.children.map((child) => (
          <Link
            key={child.label}
            href={child.href ?? '#'}
            className={MENU_ITEM}
          >
            {child.label}
          </Link>
        ))}
      </div>
    </div>
  );
};

const TopItem = ({ item }: { item: NavItem }) => {
  const base =
    'flex h-full items-center gap-1 px-3 text-sm whitespace-nowrap text-[#7b8bb0] hover:text-[#67e8f9]';
  if (!item.children) {
    return (
      <Link href={item.href ?? '#'} className={base}>
        {item.label}
      </Link>
    );
  }
  return (
    <div className='group relative h-full'>
      <button type='button' className={`${base} cursor-default`}>
        {item.label}
        <ChevronDown className='size-3.5' />
      </button>
      <div className={`${MENU} top-full left-0`}>
        {item.children.map((child) => (
          <SubMenuItem key={child.label} item={child} />
        ))}
      </div>
    </div>
  );
};

const MobileMenu = ({
  email,
  onNavigate,
}: {
  email: string;
  onNavigate: () => void;
}) => (
  <div className='border-t border-[#1e2a44] bg-[#0d1322] px-4 py-2 md:hidden'>
    {NAV.map((item) => (
      <div key={item.label}>
        {item.href ? (
          <Link href={item.href} onClick={onNavigate} className={MOBILE_ITEM}>
            {item.label}
          </Link>
        ) : (
          <p className='px-2 pt-3 pb-1 font-mono text-xs tracking-[0.2em] text-[#4b5a7d] uppercase'>
            {item.label}
          </p>
        )}
        {item.children?.map((child) => (
          <Link
            key={child.label}
            href={child.href ?? '#'}
            onClick={onNavigate}
            className={`${MOBILE_ITEM} pl-5`}
          >
            {child.label}
          </Link>
        ))}
      </div>
    ))}
    <div className='mt-2 flex items-center justify-between border-t border-[#1e2a44] px-2 pt-3 pb-1 font-mono text-xs text-[#7b8bb0]'>
      <span className='flex min-w-0 items-center gap-2'>
        <span className='size-1.5 shrink-0 rounded-full bg-[#22d3ee] shadow-[0_0_6px_#22d3ee]' />
        <span className='truncate'>{email}</span>
      </span>
      <button
        type='button'
        onClick={signOut}
        className='flex shrink-0 items-center gap-1 hover:text-[#f472b6]'
      >
        <LogOut className='size-3.5' />
        Sign out
      </button>
    </div>
  </div>
);

export const AdminNav = ({ email }: { email: string }) => {
  const [open, setOpen] = useState(false);

  return (
    <header className='sticky top-0 z-10 border-b border-[#22d3ee40] bg-[#070a12]/95 backdrop-blur'>
      <nav className='mx-auto flex h-12 max-w-7xl items-center gap-4 px-4 md:px-6'>
        <Link
          href='/'
          className='mr-4 font-mono text-sm font-semibold tracking-[0.2em] whitespace-nowrap text-[#22d3ee]'
        >
          ◆ LCRUZ//ADMIN
        </Link>
        <div className='hidden h-full items-center md:flex'>
          {NAV.map((item) => (
            <TopItem key={item.label} item={item} />
          ))}
        </div>
        <div className='ml-auto hidden items-center gap-4 font-mono text-xs text-[#7b8bb0] md:flex'>
          <span className='flex items-center gap-2'>
            <span className='size-1.5 rounded-full bg-[#22d3ee] shadow-[0_0_6px_#22d3ee]' />
            {email}
          </span>
          <button
            type='button'
            onClick={signOut}
            className='flex items-center gap-1 hover:text-[#f472b6]'
          >
            <LogOut className='size-3.5' />
            Sign out
          </button>
        </div>
        <button
          type='button'
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
          className='ml-auto text-[#7b8bb0] hover:text-[#67e8f9] md:hidden'
        >
          {open ? <X className='size-5' /> : <Menu className='size-5' />}
        </button>
      </nav>
      {open && <MobileMenu email={email} onNavigate={() => setOpen(false)} />}
    </header>
  );
};
