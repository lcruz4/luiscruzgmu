import type { NextApiRequest, NextApiResponse } from 'next';
import { logger } from '@/services/logger';

// lcruz_auth's user and role admin routes. They need a role for the `auth`
// app, which lcruz_auth checks against the forwarded session cookie.
const upstreamPath = (segments: string[]) => {
  const [root, email, sub, app, role] = segments.map(encodeURIComponent);
  if (root === 'roles' && segments.length === 1) return 'roles/';
  if (root !== 'users') return null;
  if (segments.length === 1) return 'users/';
  if (segments.length === 2) return `users/${email}`;
  if (sub !== 'roles') return null;
  if (segments.length === 3) return `users/${email}/roles`;
  if (segments.length === 5) return `users/${email}/roles/${app}/${role}`;
  return null;
};

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const segments = req.query.path;
  const path = Array.isArray(segments) ? upstreamPath(segments) : null;
  if (!path) return res.status(404).json({ error: 'Not found' });

  const method = req.method ?? 'GET';
  const hasBody = method !== 'GET' && method !== 'HEAD';

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_AUTH_DOMAIN}/${path}`,
      {
        method,
        headers: {
          'Content-Type': 'application/json',
          cookie: req.headers.cookie || '',
        },
        body: hasBody ? JSON.stringify(req.body ?? null) : undefined,
        // Signed out GETs redirect to the login page
        redirect: 'manual',
      },
    );
    if (response.status >= 300 && response.status < 400) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const text = await response.text();
    res.status(response.status).setHeader('Content-Type', 'application/json');
    return res.send(text);
  } catch (error) {
    logger.error(`${method} admin/${path} failed:`, error);
    return res.status(503).json({ error: 'Couldn’t reach lcruz_auth' });
  }
};

export default handler;
