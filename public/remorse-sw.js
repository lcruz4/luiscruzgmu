// Remorse Chess service worker: shows pushes the server sends when it's your
// move (services/remorsePush.ts) and opens the game when one is tapped.
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const badge =
    typeof data.badge === 'number' && 'setAppBadge' in self.navigator
      ? (data.badge
          ? self.navigator.setAppBadge(data.badge)
          : self.navigator.clearAppBadge()
        ).catch(() => undefined)
      : Promise.resolve();
  // iOS revokes the subscription if a push doesn't show a notification
  event.waitUntil(
    Promise.all([
      badge,
      self.registration.showNotification(data.title || 'Remorse Chess', {
        body: data.body,
        icon: '/images/pwa/remorse-chess-192.png',
        tag: data.tag,
        renotify: true,
        data: { url: data.url || '/projects/remorse-chess' },
      }),
    ]),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = new URL(event.notification.data.url, self.location.origin).href;
  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((windows) => {
        const open = windows.find((client) =>
          client.url.startsWith(self.registration.scope),
        );
        if (!open) return self.clients.openWindow(url);
        // navigate() rejects for a window this worker doesn't control yet
        return open
          .navigate(url)
          .then((client) => (client || open).focus())
          .catch(() => self.clients.openWindow(url));
      }),
  );
});
