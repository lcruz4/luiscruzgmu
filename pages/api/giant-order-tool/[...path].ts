import type { NextApiRequest, NextApiResponse } from 'next';
import { getAuthenticatedEmail } from '@/services/auth';
import {
  checkOrdered,
  linkOpenList,
  markAdded,
} from '@/services/giantKeepLinks';
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

// Opening a Giant tab and a checkout step can each take a while. Under
// Cloudflare's 100s cutoff, which answers with its own HTML page.
const TIMEOUT_MS = 90_000;
// Through the tunnel, a sleeping Mac hangs rather than refuses
const HEALTH_TIMEOUT_MS = 3_000;

const UNREACHABLE = {
  error: 'Couldn’t reach giant-cart serve on the Mac',
  reason: 'unreachable',
};

// Cloudflare swaps an origin's 502 or 504 for its own HTML page, losing the
// JSON error, so those go out as 503
const passThrough = (status: number) =>
  status === 502 || status === 504 ? 503 : status;

type Json = Record<string, unknown>;

const isJson = (value: unknown): value is Json =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const names = (rows: unknown, pick: (row: Json) => unknown) =>
  Array.isArray(rows)
    ? rows.flatMap((row) => {
        const name = isJson(row) ? pick(row) : undefined;
        return typeof name === 'string' ? [name] : [];
      })
    : [];

// Keeps the Keep "Giant" list links in step with a successful giant-cart
// answer; may add `keep` to a placed order's result
const syncKeep = async (
  route: string,
  body: unknown,
  json: Json,
): Promise<Json> => {
  if (route === 'PUT list') {
    const fromKeep = isJson(body) && body.fromKeep === true;
    await linkOpenList(fromKeep ? names(json.lines, (line) => line.name) : []);
  } else if (route === 'DELETE list') {
    await linkOpenList([]);
  } else if (route === 'POST cart') {
    const report = json.report;
    if (isJson(report) && report.dryRun === false && !report.aborted) {
      await markAdded(
        names(report.added, (item) =>
          isJson(item.input) ? item.input.name : undefined,
        ),
      );
    }
  } else if (route === 'POST checkout/answer') {
    const result = json.result;
    if (isJson(result) && result.kind === 'placed') {
      return { ...json, result: { ...result, keep: await checkOrdered() } };
    }
  }
  return json;
};

// Passes the request to giant-cart serve on the Mac and its answer back
// `fromKeep` is ours, not giant-cart's
const forwardBody = (body: unknown) => {
  if (!isJson(body)) return body ?? null;
  const { fromKeep: _, ...rest } = body;
  return rest;
};

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const segments = req.query.path;
  const path = Array.isArray(segments) ? segments.join('/') : '';
  if (!PATHS.has(path)) return res.status(404).json({ error: 'Not found' });

  if (!(await getAuthenticatedEmail(req, 'giant-order-tool'))) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const base = process.env.GIANT_ORDER_API_URL;
  const apiKey = process.env.GIANT_ORDER_TOOL_API_KEY;
  if (!base || !apiKey) {
    return res.status(503).json({
      error: 'GIANT_ORDER_API_URL or GIANT_ORDER_TOOL_API_KEY is not set',
    });
  }

  const method = req.method ?? 'GET';
  const hasBody = method !== 'GET' && method !== 'HEAD';
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`,
  };

  // Any answer means the Mac is awake, so the request below won't hang
  try {
    const health = await fetch(`${base}/health`, {
      headers,
      signal: AbortSignal.timeout(HEALTH_TIMEOUT_MS),
    });
    await health.text();
  } catch (error) {
    logger.warn('giant-cart serve health check failed:', error);
    return res.status(503).json(UNREACHABLE);
  }

  try {
    const response = await fetch(`${base}/${path}`, {
      method,
      headers,
      body: hasBody ? JSON.stringify(forwardBody(req.body)) : undefined,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    let text = await response.text();
    if (response.ok) {
      try {
        const json: unknown = JSON.parse(text);
        if (isJson(json)) {
          text = JSON.stringify(
            await syncKeep(`${method} ${path}`, req.body, json),
          );
        }
      } catch (error) {
        // Keep is a side job; the Giant answer still goes back
        logger.error(`Keep sync for ${method} ${path} failed:`, error);
      }
    }
    res
      .status(passThrough(response.status))
      .setHeader('Content-Type', 'application/json');
    return res.send(text);
  } catch (error) {
    logger.error(`${method} giant-order-tool/${path} failed:`, error);
    return res.status(503).json(UNREACHABLE);
  }
};

export default handler;
