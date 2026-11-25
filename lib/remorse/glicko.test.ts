import { inflatedRd, MAX_RD, rate } from './glicko';

describe('glicko', () => {
  // Glickman's example opponent, worked by hand
  it('rates a single game like the Glicko-1 formula', () => {
    const result = rate({ rating: 1500, rd: 200 }, { rating: 1400, rd: 30 }, 1);
    expect(result.rating).toBeCloseTo(1563.4, 1);
    expect(result.rd).toBeCloseTo(175.2, 1);
  });

  it('moves new players far and settled players little', () => {
    const fresh = rate({ rating: 1200, rd: 350 }, { rating: 1200, rd: 350 }, 1);
    const settled = rate({ rating: 1200, rd: 50 }, { rating: 1200, rd: 50 }, 1);
    expect(fresh.rating - 1200).toBeGreaterThan(100);
    expect(settled.rating - 1200).toBeLessThan(10);
  });

  it('leaves equal players unchanged on a draw', () => {
    const result = rate(
      { rating: 1300, rd: 80 },
      { rating: 1300, rd: 80 },
      0.5,
    );
    expect(result.rating).toBeCloseTo(1300);
  });

  it('grows RD with time off, capped', () => {
    const at = new Date('2026-01-01');
    expect(inflatedRd(50, null, at)).toBe(50);
    expect(inflatedRd(50, at, at)).toBe(50);
    expect(inflatedRd(50, at, new Date('2026-07-02'))).toBeGreaterThan(200);
    expect(inflatedRd(50, at, new Date('2030-01-01'))).toBe(MAX_RD);
  });
});
