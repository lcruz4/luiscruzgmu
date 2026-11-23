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

export const SIGN_IN_PATH = '/sign-in';
export const REMORSE_LANDING_PATH = '/projects/remorse-chess/welcome';
export const REMORSE_HOME = '/projects/remorse-chess';
const DEFAULT_RETURN_PATH = '/';
const BASE = 'http://base.invalid';

// Same-origin path from a `returnTo` param; anything else (`//evil.com`,
// absolute URLs, arrays) falls back to the home page.
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

// Remorse sign-in only returns into the game; anything else goes to its lobby
export const safeRemorsePath = (returnTo: unknown) => {
  const path = safeReturnPath(returnTo);
  const { pathname } = new URL(path, BASE);
  return pathname === REMORSE_HOME || pathname.startsWith(`${REMORSE_HOME}/`)
    ? path
    : REMORSE_HOME;
};
