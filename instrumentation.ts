import * as Sentry from '@sentry/nextjs';

export const register = () => {
  Sentry.init({
    dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,
    integrations: [
      Sentry.consoleLoggingIntegration({ levels: ['warn', 'error'] }),
    ],
    enableLogs: true,
    tracesSampleRate: 1,
  });
};

export const onRequestError = Sentry.captureRequestError;
