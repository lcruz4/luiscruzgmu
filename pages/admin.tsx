import Head from 'next/head';
import Link from 'next/link';
import { requireLogin } from '@/services/auth';

const SITEMAP = [
  { href: '/', label: 'Home' },
  { href: '/admin', label: 'Admin' },
  { href: '/projects/chess-review', label: 'Chess review' },
  { href: '/projects/kuromasu', label: 'Kuromasu' },
  { href: '/projects/reward-chart-landing', label: 'Reward chart landing' },
  { href: '/projects/reward-chart', label: 'Reward chart' },
  { href: '/projects/workout-tracker', label: 'Workout tracker: Log' },
  {
    href: '/projects/workout-tracker/history',
    label: 'Workout tracker: History',
  },
  { href: '/projects/workout-tracker/plan', label: 'Workout tracker: Plan' },
  {
    href: '/projects/workout-tracker/sign-in',
    label: 'Workout tracker: Sign in',
  },
];

const AdminPage = ({ email }: { email: string }) => (
  <main className='mx-auto max-w-xl p-8 text-white'>
    <Head>
      <title>Luis Cruz | Admin</title>
    </Head>
    <h1 className='mb-1 text-3xl font-bold'>Admin</h1>
    <p className='mb-6 text-sm text-gray-400'>Signed in as {email}</p>
    <h2 className='mb-3 text-xl font-bold'>Sitemap</h2>
    <ul className='flex flex-col gap-2'>
      {SITEMAP.map(({ href, label }) => (
        <li key={href}>
          <Link href={href} className='text-red-300 hover:underline'>
            {label}
          </Link>{' '}
          <span className='font-mono text-xs text-gray-500'>{href}</span>
        </li>
      ))}
    </ul>
  </main>
);

export const getServerSideProps = requireLogin;

export default AdminPage;
