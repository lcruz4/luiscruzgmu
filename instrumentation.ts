import * as Sentry from '@sentry/nextjs';

// Each remorse chess player polls its game every 2s; tracing every poll
// costs real CPU on the Pi
const REMORSE_POLL = /^GET \/api\/remorse-chess\/games\/\d+$/;

export const register = async () => {
  Sentry.init({
    dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,
    integrations: [
      Sentry.consoleLoggingIntegration({ levels: ['warn', 'error'] }),
    ],
    enableLogs: true,
    // Polls ignore the browser's sampling decision; everything else follows it
    tracesSampler: ({ name, inheritOrSampleWith }) =>
      REMORSE_POLL.test(name) ? 0 : inheritOrSampleWith(0.1),
  });
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { startClockSweep } = await import('./services/remorseClock');
    startClockSweep();
  }
};

export const onRequestError = Sentry.captureRequestError;
