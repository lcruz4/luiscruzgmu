import * as Sentry from '@sentry/nextjs';

export const register = () => {
  Sentry.init({
    dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,
    // services/logger.ts writes every level via console.log and drops < WARN in prod
    integrations: [
      Sentry.consoleLoggingIntegration({ levels: ['log', 'warn', 'error'] }),
    ],
    enableLogs: true,
    tracesSampleRate: 1,
  });
};

export const onRequestError = Sentry.captureRequestError;
