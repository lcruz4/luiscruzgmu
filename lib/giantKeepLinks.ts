// Links from Giant order lines to the Keep "Giant" items they were pulled
// from, so ordered items get checked in Keep once the order is placed. Kept in
// localStorage until giant-cart can store them (see its deferred list).

export type KeepList = {
  noteId: string;
  items: { id: string; text: string }[];
};

// pending: on the open list; added: in the Giant cart, waiting for the order
export type KeepLink = {
  noteId: string;
  itemId: string;
  text: string;
  key: string;
  status: 'pending' | 'added';
};

const STORAGE_KEY = 'giant-order:keep-links';

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

const isLink = (value: unknown): value is KeepLink =>
  typeof value === 'object' &&
  value !== null &&
  'noteId' in value &&
  typeof value.noteId === 'string' &&
  'itemId' in value &&
  typeof value.itemId === 'string' &&
  'text' in value &&
  typeof value.text === 'string' &&
  'key' in value &&
  typeof value.key === 'string' &&
  'status' in value &&
  (value.status === 'pending' || value.status === 'added');

export const readLinks = (): KeepLink[] => {
  try {
    const parsed: unknown = JSON.parse(
      localStorage.getItem(STORAGE_KEY) ?? '[]',
    );
    return Array.isArray(parsed) ? parsed.filter(isLink) : [];
  } catch {
    return [];
  }
};

const writeLinks = (links: KeepLink[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(links));
  } catch {
    // Private mode or blocked storage: Keep just won't get checked
  }
};

export const addedLinks = () =>
  readLinks().filter((link) => link.status === 'added');

// Replaces the open list's links: each of `names` (giant-cart's parsed line
// names) is linked to every pulled Keep item with the same match key
export const linkOpenList = (names: string[], keep: KeepList | null) => {
  const keys = new Set(names.map(matchKey));
  const pending: KeepLink[] = [];
  for (const item of keep?.items ?? []) {
    const key = matchKey(item.text);
    if (!keep || !keys.has(key)) continue;
    pending.push({
      noteId: keep.noteId,
      itemId: item.id,
      text: item.text,
      key,
      status: 'pending',
    });
  }
  writeLinks([...addedLinks(), ...pending]);
};

// After a real cart fill: links for the added lines wait for the order, the
// rest (out of stock, failed, skipped) are dropped
export const markAdded = (names: string[]) => {
  const keys = new Set(names.map(matchKey));
  writeLinks(
    readLinks().flatMap((link) =>
      link.status === 'added'
        ? [link]
        : keys.has(link.key)
        ? [{ ...link, status: 'added' as const }]
        : [],
    ),
  );
};

export const forgetLinks = (done: KeepLink[]) => {
  const ids = new Set(done.map((link) => link.itemId));
  writeLinks(readLinks().filter((link) => !ids.has(link.itemId)));
};
