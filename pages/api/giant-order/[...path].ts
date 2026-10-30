import type { NextApiRequest, NextApiResponse } from 'next';
import { giantOwnerEmail } from '@/services/giantOrder';
import { logger } from '@/services/logger';

// giant-cart serve's routes (giant-order-tool src/runner/httpApp.ts)
const PATHS = new Set([
  'list',
  'question',
  'answer',
  'cart',
  'checkout',
  'checkout/answer',
]);

// Opening a Giant tab and a checkout step can each take a while
const TIMEOUT_MS = 180_000;

// Passes the request to giant-cart serve on the Mac and its answer back as is
const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const segments = req.query.path;
  const path = Array.isArray(segments) ? segments.join('/') : '';
  if (!PATHS.has(path)) return res.status(404).json({ error: 'Not found' });

  if (!(await giantOwnerEmail(req.headers.cookie))) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const base = process.env.GIANT_ORDER_API_URL;
  if (!base) {
    return res.status(503).json({ error: 'GIANT_ORDER_API_URL is not set' });
  }

  const method = req.method ?? 'GET';
  const hasBody = method !== 'GET' && method !== 'HEAD';
  try {
    const response = await fetch(`${base}/${path}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: hasBody ? JSON.stringify(req.body ?? null) : undefined,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const text = await response.text();
    res.status(response.status).setHeader('Content-Type', 'application/json');
    return res.send(text);
  } catch (error) {
    logger.error(`${method} giant-order/${path} failed:`, error);
    return res
      .status(502)
      .json({ error: 'Couldn’t reach giant-cart serve on the Mac' });
  }
};

export default handler;
