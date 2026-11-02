import type { KeepCheck } from '@/types/giantOrder';
import { logger } from './logger';
import { checkItem, getGiantList, KeepApiError, type KeepItem } from './keep';
import { withTransaction, workoutPool } from './workoutDb';

// Same quantity rules as giant-cart's parseList (giant-order-tool
// src/core/parseList.ts): "Cider 2", "Cider x2", "Cider TWO", "2 Cider"
const NUMBER_WORDS = [
  'one',
  'two',
  'three',
  'four',
  'five',
  'six',
  'seven',
  'eight',
  'nine',
  'ten',
  'eleven',
  'twelve',
  'thirteen',
  'fourteen',
  'fifteen',
  'sixteen',
  'seventeen',
  'eighteen',
  'nineteen',
  'twenty',
];
const QTY = `(?:\\d+|(?:${NUMBER_WORDS.join('|')})\\b)`;
const BULLET = /^(?:[-*•]|\d+[.)])\s+/;
const TRAILING_QTY = new RegExp(`^(.+?)\\s+(?:[x×]\\s*)?${QTY}$`, 'i');
const LEADING_QTY = new RegExp(`^${QTY}\\s*[x×]?\\s+(.+)$`, 'i');

// Lowercased name without its quantity, so "Cider 2" in Keep matches "Cider"
export const matchKey = (text: string) => {
  const name = text.replace(BULLET, '').trim();
  const stripped =
    TRAILING_QTY.exec(name)?.[1] ?? LEADING_QTY.exec(name)?.[1] ?? name;
  return stripped.trim().replace(/\s+/g, ' ').toLowerCase();
};

// Replaces the open list's links: each of `names` (giant-cart's parsed line
// names) is linked to every unchecked Keep item with the same match key
export const linkOpenList = async (names: string[]) => {
  const keys = new Set(names.map(matchKey));
  const links: { noteId: string; item: KeepItem; key: string }[] = [];
  if (keys.size > 0) {
    const { noteId, items } = await getGiantList();
    for (const item of items) {
      const key = matchKey(item.text);
      if (keys.has(key)) links.push({ noteId, item, key });
    }
  }
  await withTransaction(async (client) => {
    await client.query("DELETE FROM giant_keep_links WHERE status = 'pending'");
    for (const { noteId, item, key } of links) {
      await client.query(
        `INSERT INTO giant_keep_links (note_id, item_id, text, match_key, status)
         VALUES ($1, $2, $3, $4, 'pending')`,
        [noteId, item.id, item.text, key],
      );
    }
  });
};

// After a real cart fill: links for the added lines wait for the order, the
// rest (out of stock, failed, skipped) are dropped
export const markAdded = async (names: string[]) => {
  const keys = names.map(matchKey);
  await withTransaction(async (client) => {
    await client.query(
      `UPDATE giant_keep_links SET status = 'added'
       WHERE status = 'pending' AND match_key = ANY($1)`,
      [keys],
    );
    await client.query("DELETE FROM giant_keep_links WHERE status = 'pending'");
  });
};

// Order placed: checks every added item in Keep and forgets the links
export const checkOrdered = async (): Promise<KeepCheck> => {
  const { rows } = await workoutPool.query<{
    id: number;
    noteId: string;
    itemId: string;
    text: string;
  }>(
    `SELECT id, note_id AS "noteId", item_id AS "itemId", text
     FROM giant_keep_links WHERE status = 'added' ORDER BY id`,
  );
  const result: KeepCheck = { checked: [], failed: [] };
  for (const row of rows) {
    try {
      await checkItem(row.noteId, row.itemId);
      result.checked.push(row.text);
    } catch (error) {
      // Deleted in Keep since it was pulled: nothing left to check
      if (error instanceof KeepApiError && error.status === 404) continue;
      logger.error(`Checking "${row.text}" in Keep failed:`, error);
      result.failed.push(row.text);
    }
  }
  await workoutPool.query('DELETE FROM giant_keep_links WHERE id = ANY($1)', [
    rows.map((row) => row.id),
  ]);
  return result;
};
