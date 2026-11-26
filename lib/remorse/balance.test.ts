import {
  adjustPercents,
  balancedOdds,
  facesFromPercents,
  FAIR_ODDS,
  isValidPercents,
  rollWithOdds,
  roundPercents,
  toPercents,
  traumaOdds,
} from './balance';

describe('balance', () => {
  it('keeps a fair die between equal ratings', () => {
    for (const [i, chance] of balancedOdds(1500, 1500).entries()) {
      expect(chance).toBeCloseTo(FAIR_ODDS[i]);
    }
  });

  it('gives the higher-rated player worse traumas and the lower-rated better', () => {
    const favorite = traumaOdds(balancedOdds(1600, 1200));
    const underdog = traumaOdds(balancedOdds(1200, 1600));
    expect(favorite.devastated).toBeGreaterThan(1 / 6);
    expect(favorite.psychopath).toBeLessThan(1 / 6);
    expect(underdog.devastated).toBeLessThan(1 / 6);
    expect(underdog.psychopath).toBeGreaterThan(1 / 6);
  });

  it('caps the tilt', () => {
    expect(balancedOdds(3000, 1000)).toEqual(balancedOdds(2600, 1000));
  });

  it('rolls each face in proportion to its odds', () => {
    const odds = [0.5, 0, 0, 0, 0, 0.5];
    expect(rollWithOdds(odds, () => 0)).toBe(1);
    expect(rollWithOdds(odds, (max) => max / 2 - 1)).toBe(1);
    expect(rollWithOdds(odds, (max) => max / 2)).toBe(6);
    expect(rollWithOdds(odds, (max) => max - 1)).toBe(6);
  });
});

describe('hand-set odds', () => {
  const start = { devastated: 17, guilt: 33, unaffected: 33, psychopath: 17 };
  const total = (p: Record<string, number>) =>
    Object.values(p).reduce((sum, n) => sum + n, 0);

  it('rounds trauma odds to whole percents that add up to 100', () => {
    expect(toPercents(traumaOdds(FAIR_ODDS))).toEqual(start);
    expect(total(toPercents(traumaOdds(balancedOdds(1700, 1200))))).toBe(100);
  });

  it('takes from the others in proportion when one rises', () => {
    const next = adjustPercents(start, [], 'psychopath', 50);
    expect(next.psychopath).toBe(50);
    expect(total(next)).toBe(100);
    expect(next.guilt).toBeGreaterThan(next.devastated);
    expect(total(roundPercents(next))).toBe(100);
  });

  it('spreads repeated small steps over the others, not just the biggest', () => {
    let next = start;
    for (let i = 0; i < 6; i++) {
      next = adjustPercents(next, ['guilt'], 'psychopath', next.psychopath + 1);
    }
    expect(roundPercents(next)).toEqual({
      devastated: 15,
      guilt: 33,
      unaffected: 29,
      psychopath: 23,
    });
  });

  it('leaves locked outcomes alone', () => {
    const next = adjustPercents(start, ['guilt'], 'devastated', 0);
    expect(next.guilt).toBe(33);
    expect(next.devastated).toBe(0);
    expect(total(next)).toBe(100);
  });

  it('caps a rise at what the unlocked others hold', () => {
    const next = adjustPercents(
      start,
      ['guilt', 'unaffected'],
      'psychopath',
      90,
    );
    expect(next).toEqual({ ...start, devastated: 0, psychopath: 34 });
  });

  it("can't move when everything else is locked", () => {
    expect(
      adjustPercents(
        start,
        ['guilt', 'unaffected', 'psychopath'],
        'devastated',
        50,
      ),
    ).toEqual(start);
  });

  it('refills empty outcomes evenly when one drops', () => {
    const empty = { devastated: 100, guilt: 0, unaffected: 0, psychopath: 0 };
    expect(adjustPercents(empty, [], 'devastated', 40)).toEqual({
      devastated: 40,
      guilt: 20,
      unaffected: 20,
      psychopath: 20,
    });
  });

  it('splits two-face outcomes across their faces', () => {
    expect(facesFromPercents(start)).toEqual([
      0.17, 0.165, 0.165, 0.165, 0.165, 0.17,
    ]);
  });

  it('accepts only whole percents adding up to 100', () => {
    expect(isValidPercents(start)).toBe(true);
    expect(isValidPercents({ ...start, guilt: 34 })).toBe(false);
    expect(isValidPercents({ ...start, guilt: 32.5, unaffected: 33.5 })).toBe(
      false,
    );
    expect(isValidPercents({ devastated: 100 })).toBe(false);
  });
});
