import { useState } from 'react';
import Head from 'next/head';
import { Dumbbell, ScrollText, Users } from 'lucide-react';
import { requireLogin } from '@/services/auth';
import { AdminNav } from '@/components/admin/AdminNav';
import { UsersPanel } from '@/components/admin/UsersPanel';
import { WorkoutPanel } from '@/components/admin/WorkoutPanel';

const TABS = [
  { id: 'users', label: 'Users', Icon: Users },
  { id: 'workout', label: 'Workout', Icon: Dumbbell },
  { id: 'logs', label: 'Logs', Icon: ScrollText },
] as const;

type TabId = (typeof TABS)[number]['id'];

const AdminPage = ({ email }: { email: string }) => {
  const [tab, setTab] = useState<TabId>('users');

  return (
    <div className='min-h-screen bg-[#0b0f1a] font-sans text-[#d6e2ff]'>
      <Head>
        <title>Luis Cruz | Admin</title>
        <link
          key='icon'
          rel='icon'
          href='/images/admin.svg'
          type='image/svg+xml'
        />
        <link rel='manifest' href='/manifests/admin.webmanifest' />
        <link rel='apple-touch-icon' href='/images/pwa/admin-apple-touch.png' />
        <meta name='apple-mobile-web-app-title' content='Admin' />
        <meta name='theme-color' content='#070a12' />
      </Head>
      <AdminNav email={email} />
      <main className='mx-auto max-w-7xl px-4 py-8 md:px-6'>
        <div className='mb-6 flex flex-wrap items-end justify-between gap-4'>
          <div>
            <p className='font-mono text-xs tracking-[0.2em] text-[#4b5a7d]'>
              SYS://DASHBOARD
            </p>
            <h1 className='mt-1 text-2xl font-semibold'>Control panel</h1>
          </div>
          <div className='flex gap-1 rounded-md border border-[#1e2a44] bg-[#070a12] p-1'>
            {TABS.map(({ id, label, Icon }) => (
              <button
                key={id}
                type='button'
                onClick={() => setTab(id)}
                className={`flex items-center gap-1.5 rounded px-3 py-1.5 text-sm transition-colors ${
                  tab === id
                    ? 'bg-[#22d3ee1a] text-[#67e8f9]'
                    : 'text-[#7b8bb0] hover:text-[#d6e2ff]'
                }`}
              >
                <Icon className='size-4' />
                {label}
              </button>
            ))}
          </div>
        </div>
        {tab === 'users' && <UsersPanel />}
        {tab === 'workout' && <WorkoutPanel />}
        {tab === 'logs' && (
          <section className='rounded-lg border border-dashed border-[#1e2a44] px-4 py-16 text-center font-mono text-xs text-[#4b5a7d]'>
            LOGS · coming soon
          </section>
        )}
      </main>
    </div>
  );
};

export const getServerSideProps = requireLogin('admin');

export default AdminPage;
