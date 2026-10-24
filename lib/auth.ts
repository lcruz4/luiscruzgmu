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
