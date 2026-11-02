import {
  addedLinks,
  forgetLinks,
  linkOpenList,
  markAdded,
  matchKey,
  readLinks,
} from '@/lib/giantKeepLinks';

describe('matchKey', () => {
  it.each([
    ['Cider 2', 'cider'],
    ['Cider x2', 'cider'],
    ['Cider TWO', 'cider'],
    ['2 Cider', 'cider'],
    ['two cider', 'cider'],
    ['- Oat  milk', 'oat milk'],
    ['Almond milk one', 'almond milk'],
    ['V8', 'v8'],
    ['Frozen blueberries 1', 'frozen blueberries'],
  ])('%s → %s', (text, key) => {
    expect(matchKey(text)).toBe(key);
  });
});

describe('links', () => {
  const store = new Map<string, string>();
  beforeAll(() => {
    Object.assign(globalThis, {
      localStorage: {
        getItem: (key: string) => store.get(key) ?? null,
        setItem: (key: string, value: string) => store.set(key, value),
      },
    });
  });
  beforeEach(() => store.clear());

  const keep = {
    noteId: 'note',
    items: [
      { id: 'a', text: 'Cider 2' },
      { id: 'b', text: 'Oat milk' },
      { id: 'c', text: 'Soy sauce' },
    ],
  };

  it('links matching lines, keeps added ones, drops the rest', () => {
    linkOpenList(['Cider', 'Oat milk', 'Bananas'], keep);
    expect(readLinks().map((link) => link.itemId)).toEqual(['a', 'b']);

    markAdded(['cider']);
    expect(addedLinks().map((link) => link.itemId)).toEqual(['a']);
    expect(readLinks()).toHaveLength(1);

    // A new list keeps links still waiting for the order
    linkOpenList(['Soy sauce'], keep);
    expect(readLinks().map((link) => [link.itemId, link.status])).toEqual([
      ['a', 'added'],
      ['c', 'pending'],
    ]);

    forgetLinks(addedLinks());
    expect(readLinks().map((link) => link.itemId)).toEqual(['c']);
  });

  it('a pasted list links nothing', () => {
    linkOpenList(['Cider'], null);
    expect(readLinks()).toEqual([]);
  });
});
