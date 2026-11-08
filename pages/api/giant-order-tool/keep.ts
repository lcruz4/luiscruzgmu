import type { NextApiRequest, NextApiResponse } from 'next';
import { getAuthenticatedEmail } from '@/services/auth';
import {
  addItem,
  getGiantList,
  KeepApiError,
  setChecked,
  setText,
} from '@/services/keep';
import { logger } from '@/services/logger';
import type { KeepCheck, KeepItem, KeepList } from '@/types/giantOrder';

const isStrings = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'string');

// giant-cart's placed order hands back the ids; ones no longer unchecked in
// Keep (checked or deleted since) are skipped
const checkOrdered = async (itemIds: string[]): Promise<KeepCheck> => {
  const { noteId, items } = await getGiantList();
  const ids = new Set(itemIds);
  const result: KeepCheck = { checked: [], failed: [] };
  for (const item of items) {
    if (!ids.has(item.id)) continue;
    try {
      await setChecked(noteId, item.id, true);
      result.checked.push(item.text);
    } catch (error) {
      if (error instanceof KeepApiError && error.status === 404) continue;
      logger.error(`Checking "${item.text}" in Keep failed:`, error);
      result.failed.push(item.text);
    }
  }
  return result;
};

const sendError = (res: NextApiResponse, error: unknown) => {
  logger.error('Keep request failed:', error);
  if (error instanceof KeepApiError && error.status === 404) {
    return res.status(404).json({ error: error.message });
  }
  return res.status(503).json({
    error:
      error instanceof KeepApiError ? error.message : 'Couldn’t reach Keep',
  });
};

// GET: the unchecked items of the Keep "Giant" list.
// PATCH `{ noteId, itemId, checked }`: checks or unchecks one item;
// `{ noteId, itemId, text }` renames it.
// POST `{ itemIds }`: checks the ordered items; `{ noteId, text }` adds one.
const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (!['GET', 'PATCH', 'POST'].includes(req.method ?? '')) {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!(await getAuthenticatedEmail(req, 'giant-order-tool'))) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    if (req.method === 'POST' && typeof req.body?.noteId === 'string') {
      const text: unknown = req.body.text;
      if (typeof text !== 'string' || !text.trim()) {
        return res.status(400).json({ error: 'Invalid text' });
      }
      const { id } = await addItem(req.body.noteId, text.trim());
      const item: KeepItem = { id, text: text.trim(), checked: false };
      return res.status(201).json(item);
    }

    if (req.method === 'POST') {
      const itemIds: unknown = req.body?.itemIds;
      if (!isStrings(itemIds)) {
        return res.status(400).json({ error: 'Invalid itemIds' });
      }
      return res.status(200).json(await checkOrdered(itemIds));
    }

    if (req.method === 'PATCH') {
      const { noteId, itemId, checked, text } = req.body ?? {};
      if (typeof noteId !== 'string' || typeof itemId !== 'string') {
        return res.status(400).json({ error: 'Invalid item' });
      }
      if (typeof checked === 'boolean') {
        await setChecked(noteId, itemId, checked);
        return res.status(200).json({ checked });
      }
      if (typeof text === 'string' && text.trim()) {
        await setText(noteId, itemId, text.trim());
        return res.status(200).json({ text: text.trim() });
      }
      return res.status(400).json({ error: 'Invalid item' });
    }

    const { noteId, items } = await getGiantList();
    const list: KeepList = {
      noteId,
      items: items.map(({ id, text }) => ({ id, text, checked: false })),
    };
    return res.status(200).json(list);
  } catch (error) {
    return sendError(res, error);
  }
};

export default handler;
