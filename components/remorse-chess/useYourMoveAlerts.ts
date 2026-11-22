import { useEffect, useRef, useState } from 'react';

type Alert = { id: number; text: string };

const BELL_SRC = '/audio/remorse-bell.m4a';

const notificationsSupported = () =>
  typeof window !== 'undefined' && 'Notification' in window;

// Badges the installed app icon with how many games wait on you, rings the
// bell when a new one does and, once allowed, also notifies while the tab is
// in the background. `alerts` is undefined until the first load so that load
// doesn't ring or notify.
export const useYourMoveAlerts = (alerts: Alert[] | undefined) => {
  const seen = useRef<Set<number> | null>(null);
  const [permission, setPermission] = useState<
    NotificationPermission | 'unsupported'
  >('unsupported');

  useEffect(() => {
    if (notificationsSupported()) setPermission(Notification.permission);
  }, []);

  useEffect(() => {
    if (!alerts) return;
    if ('setAppBadge' in navigator) {
      const badge = alerts.length
        ? navigator.setAppBadge(alerts.length)
        : navigator.clearAppBadge();
      badge.catch(() => undefined);
    }
    const previous = seen.current;
    seen.current = new Set(alerts.map((alert) => alert.id));
    if (!previous) return;
    const fresh = alerts.filter((alert) => !previous.has(alert.id));
    if (!fresh.length) return;
    // Autoplay rules block it until the page has had a click or key press
    new Audio(BELL_SRC).play().catch(() => undefined);
    if (
      !document.hidden ||
      !notificationsSupported() ||
      Notification.permission !== 'granted'
    ) {
      return;
    }
    for (const alert of fresh) {
      // Android only allows notifications from a service worker, where
      // the constructor throws
      try {
        const note = new Notification('Remorse Chess', {
          body: alert.text,
          icon: '/images/pwa/remorse-chess-192.png',
          tag: `remorse-${alert.id}`,
          // the bell is the sound
          silent: true,
        });
        note.onclick = () => {
          window.focus();
          window.location.href = `/projects/remorse-chess/${alert.id}`;
        };
      } catch {
        break;
      }
    }
  }, [alerts]);

  const enable = async () => {
    if (!notificationsSupported()) return;
    setPermission(await Notification.requestPermission());
  };

  return { permission, enable };
};
