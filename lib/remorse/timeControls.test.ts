import { categoryOf, isLive, timeControlOf } from './timeControls';

describe('time controls', () => {
  it('reads a live control', () => {
    expect(timeControlOf('3+2')).toMatchObject({
      category: 'blitz',
      label: '3 + 2',
      initialMs: 180_000,
      incrementMs: 2000,
    });
    expect(isLive('3+2')).toBe(true);
  });

  it('reads a daily control', () => {
    expect(timeControlOf('3d')).toMatchObject({
      category: 'daily',
      label: '3 days',
      perMoveMs: 3 * 86_400_000,
    });
    expect(isLive('3d')).toBe(false);
  });

  it('counts untimed games as daily', () => {
    expect(categoryOf(null)).toBe('daily');
    expect(isLive(null)).toBe(false);
  });
});
