import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { fetchGames, GAMES_KEY } from './useGame';

type Alert = { id: number; text: string };

export const BELL_SRC = '/audio/remorse-bell.m4a';
const SW_SRC = '/remorse-sw.js';
const SW_SCOPE = '/projects/remorse-chess';

// Push needs a service worker; on iOS only an app added to the Home Screen
// gets PushManager
export const pushSupported = () =>
  typeof window !== 'undefined' &&
  'Notification' in window &&
  'serviceWorker' in navigator &&
  'PushManager' in window;

const setBadge = (count: number) => {
  if (!('setAppBadge' in navigator)) return;
  const badge = count
    ? navigator.setAppBadge(count)
    : navigator.clearAppBadge();
  badge.catch(() => undefined);
};

const base64ToBytes = (base64: string) => {
  const raw = atob(
    (base64 + '='.repeat((4 - (base64.length % 4)) % 4))
      .replace(/-/g, '+')
      .replace(/_/g, '/'),
  );
  return Uint8Array.from(raw, (char) => char.charCodeAt(0));
};

// Registers the worker, subscribes (or reuses the subscription) and hands it
// to the server, which may have dropped it or never seen it
export const subscribe = async () => {
  const registration = await navigator.serviceWorker.register(SW_SRC, {
    scope: SW_SCOPE,
  });
  await navigator.serviceWorker.ready;
  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    const response = await fetch('/api/remorse-chess/push');
    const { publicKey } = (await response.json()) as {
      publicKey: string | null;
    };
    if (!publicKey) return;
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: base64ToBytes(publicKey),
    });
  }
  await fetch('/api/remorse-chess/push', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(subscription),
  });
};

// Badges the installed app icon with how many games wait on you and rings the
// bell when a new one does. Once allowed, the server pushes a notification for
// each new one, also while the app is closed. `alerts` is undefined until the
// first load so that load doesn't ring.
export const useYourMoveAlerts = (alerts: Alert[] | undefined) => {
  const seen = useRef<Set<number> | null>(null);
  const [permission, setPermission] = useState<
    NotificationPermission | 'unsupported'
  >('unsupported');

  useEffect(() => {
    if (!pushSupported()) return;
    setPermission(Notification.permission);
    if (Notification.permission === 'granted') {
      subscribe().catch(() => undefined);
    }
  }, []);

  useEffect(() => {
    if (!alerts) return;
    setBadge(alerts.length);
    const previous = seen.current;
    seen.current = new Set(alerts.map((alert) => alert.id));
    if (!previous) return;
    if (alerts.some((alert) => !previous.has(alert.id))) {
      // Autoplay rules block it until the page has had a click or key press
      new Audio(BELL_SRC).play().catch(() => undefined);
    }
  }, [alerts]);

  // iOS only shows the prompt when asked from a tap
  const enable = async () => {
    if (!pushSupported()) return;
    const result = await Notification.requestPermission();
    setPermission(result);
    if (result === 'granted') await subscribe().catch(() => undefined);
  };

  return { permission, enable };
};

// On a game page: whenever the game changes (your move, theirs), reloads the
// lobby list so the app badge and the lobby are current
export const useBadgeSync = (version: number | undefined) => {
  const queryClient = useQueryClient();
  useEffect(() => {
    if (version === undefined) return;
    queryClient
      .fetchQuery({ queryKey: GAMES_KEY, queryFn: fetchGames, staleTime: 0 })
      .then((games) => setBadge(games.filter((game) => game.yourMove).length))
      .catch(() => undefined);
  }, [queryClient, version]);
};
