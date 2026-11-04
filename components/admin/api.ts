import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export type User = { email: string; name: string };
export type AppRole = { app: string; role: string };

const request = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(`/api/admin/${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json' },
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(body?.error || `Request failed (${response.status})`);
  }
  return body;
};

// Admin errors should surface right away rather than after retries
const retry = false;

const userPath = (email: string) => `users/${encodeURIComponent(email)}`;

const KEYS = {
  users: ['admin', 'users'],
  roles: ['admin', 'roles'],
  userRoles: (email: string) => ['admin', 'users', email, 'roles'],
};

export const useUsers = () =>
  useQuery({
    queryKey: KEYS.users,
    queryFn: () => request<User[]>('users'),
    retry,
  });

export const useAppRoles = () =>
  useQuery({
    queryKey: KEYS.roles,
    queryFn: () => request<AppRole[]>('roles'),
    retry,
  });

export const useUserRoles = (email: string) =>
  useQuery({
    queryKey: KEYS.userRoles(email),
    queryFn: () => request<AppRole[]>(`${userPath(email)}/roles`),
    retry,
  });

export const useCreateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (user: User) =>
      request<User>('users', { method: 'POST', body: JSON.stringify(user) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEYS.users }),
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (email: string) =>
      request<string>(userPath(email), { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.users });
      queryClient.invalidateQueries({ queryKey: KEYS.roles });
    },
  });
};

export const useGrantRole = (email: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (role: AppRole) =>
      request(`${userPath(email)}/roles`, {
        method: 'POST',
        body: JSON.stringify(role),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.userRoles(email) });
      queryClient.invalidateQueries({ queryKey: KEYS.roles });
    },
  });
};

export const useRevokeRole = (email: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ app, role }: AppRole) =>
      request(
        `${userPath(email)}/roles/${encodeURIComponent(
          app,
        )}/${encodeURIComponent(role)}`,
        { method: 'DELETE' },
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.userRoles(email) });
      queryClient.invalidateQueries({ queryKey: KEYS.roles });
    },
  });
};
