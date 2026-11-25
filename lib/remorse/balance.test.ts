import { balancedOdds, FAIR_ODDS, rollWithOdds, traumaOdds } from './balance';

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
