// Auth service URLs; safe on client and server.
// `domain` is the host the session cookie is set on (no port).
export const authLoginUrl = (redirectTo: string, domain: string) =>
  `${process.env.NEXT_PUBLIC_AUTH_DOMAIN}/auth/login?${new URLSearchParams({
    redirectTo,
    domain,
  })}`;

export const authLogoutUrl = (redirectTo: string) =>
  `${process.env.NEXT_PUBLIC_AUTH_DOMAIN}/auth/logout?${new URLSearchParams({
    redirectTo,
  })}`;

export const SIGN_IN_PATH = '/projects/workout-tracker/sign-in';
const DEFAULT_RETURN_PATH = '/projects/workout-tracker';
const BASE = 'http://base.invalid';

// Same-origin path from a `returnTo` param; anything else (`//evil.com`,
// absolute URLs, arrays) falls back to the tracker.
export const safeReturnPath = (returnTo: unknown) => {
  if (typeof returnTo !== 'string' || !returnTo) return DEFAULT_RETURN_PATH;
  try {
    const url = new URL(returnTo, BASE);
    if (url.origin === BASE) return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    // Unparseable; fall through
  }
  return DEFAULT_RETURN_PATH;
};
