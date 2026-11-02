import type { NextApiRequest, NextApiResponse } from 'next';
import { getAuthenticatedEmail } from '@/services/auth';
import { checkItem, getGiantList, KeepApiError } from '@/services/keep';
import { logger } from '@/services/logger';
import type { KeepCheck } from '@/types/giantOrder';

type CheckLink = { noteId: string; itemId: string; text: string };

const isCheckLink = (value: unknown): value is CheckLink =>
  typeof value === 'object' &&
  value !== null &&
  'noteId' in value &&
  typeof value.noteId === 'string' &&
  'itemId' in value &&
  typeof value.itemId === 'string' &&
  'text' in value &&
  typeof value.text === 'string';

const checkLinks = async (links: CheckLink[]): Promise<KeepCheck> => {
  const result: KeepCheck = { checked: [], failed: [] };
  for (const link of links) {
    try {
      await checkItem(link.noteId, link.itemId);
      result.checked.push(link.text);
    } catch (error) {
      // Deleted in Keep since it was pulled: nothing left to check
      if (error instanceof KeepApiError && error.status === 404) continue;
      logger.error(`Checking "${link.text}" in Keep failed:`, error);
      result.failed.push(link.text);
    }
  }
  return result;
};

// GET: the unchecked items of the Keep "Giant" list, to fill the list.
// POST `{ links }`: checks the ordered items in Keep.
const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!(await getAuthenticatedEmail(req, 'giant-order-tool'))) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'POST') {
    const links: unknown = req.body?.links;
    if (!Array.isArray(links) || !links.every(isCheckLink)) {
      return res.status(400).json({ error: 'Invalid links' });
    }
    return res.status(200).json(await checkLinks(links));
  }

  try {
    const { noteId, items } = await getGiantList();
    return res.status(200).json({
      noteId,
      items: items.map(({ id, text }) => ({ id, text })),
    });
  } catch (error) {
    logger.error('Pulling the Keep list failed:', error);
    if (error instanceof KeepApiError && error.status === 404) {
      return res.status(404).json({ error: error.message });
    }
    return res.status(503).json({
      error:
        error instanceof KeepApiError ? error.message : 'Couldn’t reach Keep',
    });
  }
};

export default handler;
