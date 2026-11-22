import { useEffect, useRef, useState } from 'react';

type Alert = { id: number; text: string };

const notificationsSupported = () =>
  typeof window !== 'undefined' && 'Notification' in window;

// Badges the installed app icon with how many games wait on you and, once
// allowed, notifies when a new one does while the tab is in the background.
// `alerts` is undefined until the first load so that load doesn't notify.
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
    const ids = new Set(alerts.map((alert) => alert.id));
    if (
      seen.current &&
      document.hidden &&
      notificationsSupported() &&
      Notification.permission === 'granted'
    ) {
      for (const alert of alerts) {
        if (seen.current.has(alert.id)) continue;
        const note = new Notification('Remorse Chess', {
          body: alert.text,
          icon: '/images/pwa/remorse-chess-192.png',
          tag: `remorse-${alert.id}`,
        });
        note.onclick = () => {
          window.focus();
          window.location.href = `/projects/remorse-chess/${alert.id}`;
        };
      }
    }
    seen.current = ids;
  }, [alerts]);

  const enable = async () => {
    if (!notificationsSupported()) return;
    setPermission(await Notification.requestPermission());
  };

  return { permission, enable };
};
