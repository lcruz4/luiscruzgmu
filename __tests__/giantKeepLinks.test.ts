import { matchKey } from '@/services/giantKeepLinks';

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
