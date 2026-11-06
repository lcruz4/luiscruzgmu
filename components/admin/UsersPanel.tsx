import { useState } from 'react';
import type { FormEvent } from 'react';
import { Check, Loader2, Plus, Search, Trash2, X } from 'lucide-react';
import {
  type AppRole,
  type User,
  useAppRoles,
  useCreateUser,
  useDeleteUser,
  useGrantRole,
  useRevokeRole,
  useUserRoles,
  useUsers,
} from './api';
import {
  ConfirmButton,
  ErrorText,
  INPUT,
  PRIMARY_BTN,
  SECONDARY_BTN,
} from './ui';

const CUSTOM = '__custom__';
// Below md each row is a card: cells lose vertical padding and stack in a grid
const STACK_CELL = 'block px-4 align-middle md:table-cell md:py-3';
const roleKey = ({ app, role }: AppRole) => `${app}/${role}`;

const RoleChip = ({ email, role }: { email: string; role: AppRole }) => {
  const revoke = useRevokeRole(email);
  return (
    <span className='inline-flex items-center gap-1 rounded bg-[#22d3ee1a] py-0.5 pr-1 pl-2 font-mono text-xs text-[#67e8f9] ring-1 ring-[#22d3ee33]'>
      {role.app}
      <span className='text-[#4b8a99]'>/</span>
      {role.role}
      <button
        type='button'
        aria-label={`Remove ${roleKey(role)}`}
        disabled={revoke.isPending}
        onClick={() => revoke.mutate(role)}
        className='ml-0.5 rounded p-0.5 text-[#4b8a99] hover:bg-[#f472b61f] hover:text-[#f472b6]'
      >
        {revoke.isPending ? (
          <Loader2 className='size-3 animate-spin' />
        ) : (
          <X className='size-3' />
        )}
      </button>
    </span>
  );
};

const AddRole = ({ email, held }: { email: string; held: AppRole[] }) => {
  const { data: appRoles = [] } = useAppRoles();
  const grant = useGrantRole(email);
  const [selected, setSelected] = useState('');
  const [custom, setCustom] = useState({ app: '', role: '' });

  const heldKeys = new Set(held.map(roleKey));
  const options = appRoles.filter((role) => !heldKeys.has(roleKey(role)));
  // lcruz_auth only grants roles for apps in its apps table
  const apps = [...new Set(appRoles.map(({ app }) => app))];

  const submit = (role: AppRole) =>
    grant.mutate(role, {
      onSuccess: () => {
        setSelected('');
        setCustom({ app: '', role: '' });
      },
    });

  const onSelect = (value: string) => {
    if (value === CUSTOM || !value) return setSelected(value);
    const role = options.find((option) => roleKey(option) === value);
    if (role) submit(role);
  };

  const onCustomSubmit = (event: FormEvent) => {
    event.preventDefault();
    const app = custom.app.trim();
    const role = custom.role.trim();
    if (app && role) submit({ app, role });
  };

  return (
    <div>
      {selected === CUSTOM ? (
        <form onSubmit={onCustomSubmit} className='flex items-center gap-1.5'>
          <select
            required
            value={custom.app}
            onChange={(e) => setCustom({ ...custom, app: e.target.value })}
            className={`${INPUT} h-7 w-40 font-mono text-xs`}
          >
            <option value=''>app</option>
            {apps.map((app) => (
              <option key={app} value={app}>
                {app}
              </option>
            ))}
          </select>
          <input
            autoFocus
            required
            placeholder='role'
            value={custom.role}
            onChange={(e) => setCustom({ ...custom, role: e.target.value })}
            className={`${INPUT} h-7 w-24 font-mono text-xs`}
          />
          <button
            type='submit'
            aria-label='Grant role'
            disabled={grant.isPending}
            className='rounded p-1 text-[#22d3ee] hover:bg-[#22d3ee1a]'
          >
            <Check className='size-4' />
          </button>
          <button
            type='button'
            aria-label='Cancel'
            onClick={() => {
              setSelected('');
              grant.reset();
            }}
            className='rounded p-1 text-[#7b8bb0] hover:bg-[#ffffff0d]'
          >
            <X className='size-4' />
          </button>
        </form>
      ) : (
        <select
          value={selected}
          disabled={grant.isPending}
          onChange={(e) => onSelect(e.target.value)}
          className='h-7 w-28 cursor-pointer rounded border border-dashed border-[#2b3a5c] bg-transparent px-2 font-mono text-xs text-[#7b8bb0] hover:border-[#22d3ee] hover:text-[#67e8f9] focus:outline-none'
        >
          <option value=''>+ role</option>
          {options.map((role) => (
            <option key={roleKey(role)} value={roleKey(role)}>
              {roleKey(role)}
            </option>
          ))}
          <option value={CUSTOM}>Custom…</option>
        </select>
      )}
      <ErrorText error={grant.error} />
    </div>
  );
};

const DeleteUser = ({ email }: { email: string }) => {
  const remove = useDeleteUser();
  return (
    <ConfirmButton
      icon={<Trash2 className='size-3.5' />}
      label='Delete'
      confirmLabel='Confirm'
      onConfirm={() => remove.mutate(email)}
      pending={remove.isPending}
      error={remove.error}
    />
  );
};

const UserRow = ({ user }: { user: User }) => {
  const { data: roles = [], isPending, error } = useUserRoles(user.email);
  return (
    <tr className='grid grid-cols-[minmax(0,1fr)_auto] border-t border-[#1e2a44] py-2 hover:bg-[#ffffff05] md:table-row md:py-0'>
      <td className={`${STACK_CELL} text-[#d6e2ff]`}>{user.name}</td>
      <td
        className={`${STACK_CELL} row-start-2 truncate font-mono text-sm text-[#7b8bb0] md:whitespace-normal`}
      >
        {user.email}
      </td>
      <td className={`${STACK_CELL} col-span-2 pt-2`}>
        <div className='flex flex-wrap items-center gap-1.5'>
          {isPending && (
            <Loader2 className='size-3.5 animate-spin text-[#4b5a7d]' />
          )}
          {roles.map((role) => (
            <RoleChip key={roleKey(role)} email={user.email} role={role} />
          ))}
          {!isPending && <AddRole email={user.email} held={roles} />}
        </div>
        <ErrorText error={error} />
      </td>
      <td
        className={`${STACK_CELL} col-start-2 row-span-2 row-start-1 self-center text-right`}
      >
        <DeleteUser email={user.email} />
      </td>
    </tr>
  );
};

const NewUserRow = ({ onDone }: { onDone: () => void }) => {
  const create = useCreateUser();
  const [user, setUser] = useState<User>({ email: '', name: '' });
  const [closing, setClosing] = useState(false);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const email = user.email.trim();
    const name = user.name.trim();
    if (email && name) create.mutate({ email, name }, { onSuccess: onDone });
  };

  return (
    <tr
      className={`grid gap-2 border-t border-[#22d3ee55] bg-[#22d3ee0a] py-3 duration-300 ease-out md:table-row md:py-0 ${
        closing
          ? 'animate-out fade-out slide-out-to-top-2 fill-mode-forwards'
          : 'animate-in fade-in slide-in-from-top-2'
      }`}
    >
      <td className={STACK_CELL}>
        <input
          form='new-user'
          autoFocus
          required
          placeholder='Ada Lovelace'
          value={user.name}
          onChange={(e) => setUser({ ...user, name: e.target.value })}
          className={`${INPUT} w-full`}
        />
      </td>
      <td className={STACK_CELL}>
        <input
          form='new-user'
          required
          type='email'
          placeholder='ada@example.com'
          value={user.email}
          onChange={(e) => setUser({ ...user, email: e.target.value })}
          className={`${INPUT} w-full font-mono`}
        />
      </td>
      <td className={`${STACK_CELL} text-xs text-[#4b5a7d]`}>
        Grant roles after saving
        <ErrorText error={create.error} />
      </td>
      <td className={`${STACK_CELL} md:text-right`}>
        <form
          id='new-user'
          onSubmit={submit}
          className='inline-flex items-center gap-1.5'
        >
          <button
            type='submit'
            disabled={create.isPending}
            className={PRIMARY_BTN}
          >
            {create.isPending ? (
              <Loader2 className='size-3.5 animate-spin' />
            ) : (
              <Check className='size-3.5' />
            )}
            Save
          </button>
          <button
            type='button'
            onClick={() => {
              // Let the exit animation play before unmounting
              setClosing(true);
              setTimeout(onDone, 300);
            }}
            className={SECONDARY_BTN}
          >
            Cancel
          </button>
        </form>
      </td>
    </tr>
  );
};

export const UsersPanel = () => {
  const { data: users = [], isPending, error } = useUsers();
  const [adding, setAdding] = useState(false);
  const [filter, setFilter] = useState('');

  const needle = filter.trim().toLowerCase();
  const shown = users.filter(
    (user) =>
      !needle ||
      user.email.toLowerCase().includes(needle) ||
      user.name.toLowerCase().includes(needle),
  );

  return (
    <section className='overflow-hidden rounded-lg border border-[#1e2a44] bg-[#111829]'>
      <div className='flex flex-wrap items-center gap-x-4 gap-y-3 border-b border-[#1e2a44] px-4 py-3'>
        <h2 className='font-mono text-xs tracking-[0.2em] text-[#7b8bb0]'>
          USERS <span className='text-[#22d3ee]'>· {users.length}</span>
        </h2>
        <div className='relative order-last basis-full sm:order-none sm:ml-auto sm:basis-auto'>
          <Search className='pointer-events-none absolute top-1/2 left-2 size-3.5 -translate-y-1/2 text-[#4b5a7d]' />
          <input
            placeholder='Filter users'
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className={`${INPUT} w-full pl-7 sm:w-64`}
          />
        </div>
        <button
          type='button'
          onClick={() => setAdding(true)}
          disabled={adding}
          className={`${PRIMARY_BTN} ml-auto sm:ml-0`}
        >
          <Plus className='size-3.5' />
          Add user
        </button>
      </div>
      <table className='block w-full text-left text-sm md:table'>
        <thead className='hidden md:table-header-group'>
          <tr className='font-mono text-[11px] tracking-[0.15em] text-[#4b5a7d]'>
            <th className='w-1/5 px-4 py-2 font-normal'>NAME</th>
            <th className='w-1/4 px-4 py-2 font-normal'>EMAIL</th>
            <th className='px-4 py-2 font-normal'>ROLES</th>
            <th className='w-44 px-4 py-2' />
          </tr>
        </thead>
        <tbody className='block md:table-row-group'>
          {adding && <NewUserRow onDone={() => setAdding(false)} />}
          {shown.map((user) => (
            <UserRow key={user.email} user={user} />
          ))}
        </tbody>
      </table>
      {isPending && (
        <p className='flex items-center gap-2 px-4 py-6 font-mono text-xs text-[#7b8bb0]'>
          <Loader2 className='size-3.5 animate-spin' /> Loading users…
        </p>
      )}
      {error && (
        <p className='px-4 py-6 font-mono text-xs text-[#f472b6]'>
          {error.message}
        </p>
      )}
      {!isPending && !error && shown.length === 0 && (
        <p className='px-4 py-6 font-mono text-xs text-[#4b5a7d]'>
          {needle ? 'No users match that filter' : 'No users yet'}
        </p>
      )}
    </section>
  );
};
