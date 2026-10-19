import { logger } from './logger';

export async function getAuthenticatedEmail(
  cookie: string | undefined,
): Promise<string | null> {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_AUTH_DOMAIN}/auth/authorize`,
      { headers: { cookie: cookie || '' } },
    );
    return response.headers.get('x-authenticated-email') || null;
  } catch (error) {
    logger.error('Auth check failed:', error);
    return null;
  }
}
