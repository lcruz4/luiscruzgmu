import type { NextApiRequest, NextApiResponse } from 'next';
import { HttpError, idField } from '@/services/api';
import { getAuthenticatedEmail } from '@/services/auth';
import { logger } from '@/services/logger';
import { gameVersion } from '@/services/remorseDb';
import { isLive, subscribeToGame } from '@/services/remorseLive';

// Server-sent events: the game's version on connect, then each new one. Keeps
// proxies from closing the idle connection.
const HEARTBEAT_MS = 25_000;

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  let id: number;
  try {
    id = idField(req.query.id, 'id');
  } catch (error) {
    if (error instanceof HttpError)
      return res.status(error.status).json({ error: error.message });
    throw error;
  }
  if (!(await getAuthenticatedEmail(req, 'remorse-chess'))) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  // The client falls back to polling
  if (!isLive())
    return res.status(503).json({ error: 'Live updates are down' });

  const send = (message: string) => res.write(`data: ${message}\n\n`);
  let unsubscribe: (() => Promise<void>) | undefined;
  try {
    unsubscribe = await subscribeToGame(id, send);
    const version = await gameVersion(id);
    if (version === undefined) {
      await unsubscribe();
      return res.status(404).json({ error: 'Game not found' });
    }
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      // Next's gzip and nginx would otherwise buffer the stream
      'Content-Encoding': 'none',
      'X-Accel-Buffering': 'no',
    });
    send(String(version));
  } catch (error) {
    await unsubscribe?.();
    logger.error(`GET ${req.url} failed:`, error);
    // Once the stream has started a status can't be sent; the client reconnects
    if (res.headersSent) return res.end();
    return res.status(500).json({ error: 'Internal server error' });
  }

  const heartbeat = setInterval(() => res.write(': ping\n\n'), HEARTBEAT_MS);
  // Resolves when the client leaves, so Next doesn't treat the open response
  // as unanswered
  await new Promise<void>((resolve) => {
    if (res.destroyed) resolve();
    else res.on('close', resolve);
  });
  clearInterval(heartbeat);
  await unsubscribe();
};

export default handler;
