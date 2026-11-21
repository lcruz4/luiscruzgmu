import type { GameState, Piece } from '@/types/remorse';
import {
  applyAction,
  initialState,
  legalMoves,
  RULES,
  traumaForRoll,
} from './engine';

const piece = (
  id: string,
  square: string,
  extra: Partial<Piece> = {},
): Piece => ({
  id,
  color: id[0] === 'w' ? 'w' : 'b',
  type: id[1] as Piece['type'],
  square,
  trauma: null,
  healed: false,
  turnsLeft: 0,
  devastatedOnTurn: null,
  kills: 0,
  moved: false,
  ...extra,
});

const game = (pieces: Piece[], extra: Partial<GameState> = {}): GameState => ({
  pieces: [piece('wk', 'e1'), piece('bk', 'e8'), ...pieces],
  turn: 'w',
  extraMovePieceId: null,
  turnNumber: 1,
  winner: null,
  enPassant: null,
  ...extra,
});

const roll = (value: number) => jest.fn(() => value);
const noRoll = () => {
  throw new Error('unexpected roll');
};
const find = (state: GameState, id: string) =>
  state.pieces.find((p) => p.id === id);
const mv = (from: string, to: string) => ({ type: 'move' as const, from, to });
// Kings placed by hand instead of e1/e8
const board = (pieces: Piece[], extra: Partial<GameState> = {}) => ({
  ...game([], extra),
  pieces,
});
// Black king boxed in on h8; white's rook to a8 mates unless h7 is free
const backRank = (bishop: Partial<Piece> = {}) =>
  board([
    piece('wk', 'e1'),
    piece('bk', 'h8'),
    piece('bp-g', 'g7'),
    piece('wr-a', 'a1'),
    piece('wb-f', 'd3', bishop),
  ]);

describe('traumaForRoll', () => {
  it('maps the d6', () => {
    expect([1, 2, 3, 4, 5, 6].map(traumaForRoll)).toEqual([
      'devastated',
      'guilt',
      'guilt',
      'unaffected',
      'unaffected',
      'psychopath',
    ]);
  });
});

describe('moves', () => {
  it('starts with 32 pieces, white to move', () => {
    const state = initialState();
    expect(state.pieces).toHaveLength(32);
    expect(state.turn).toBe('w');
  });

  it('passes the turn and rejects moving the other side', () => {
    const { state } = applyAction(initialState(), mv('e2', 'e4'), noRoll);
    expect(state.turn).toBe('b');
    expect(() => applyAction(state, mv('d2', 'd4'), noRoll)).toThrow(
      'own pieces',
    );
  });

  it('rejects capturing your own piece', () => {
    expect(() => applyAction(initialState(), mv('a1', 'a2'), noRoll)).toThrow();
  });

  it('castles the rook along with the king', () => {
    const state = game([piece('wr-h', 'h1')]);
    const next = applyAction(state, mv('e1', 'g1'), noRoll).state;
    expect(find(next, 'wr-h')?.square).toBe('f1');
  });

  it('promotes a pawn to the chosen piece, keeping its markers', () => {
    const state = game([piece('wp-a', 'a7', { trauma: 'guilt' })]);
    expect(() => applyAction(state, mv('a7', 'a8'), noRoll)).toThrow('promote');
    const action = { ...mv('a7', 'a8'), promotion: 'n' as const };
    const pawn = find(applyAction(state, action, noRoll).state, 'wp-a');
    expect(pawn).toMatchObject({ type: 'n', trauma: 'guilt' });
  });

  it('ends the game when a king is captured', () => {
    const state = game([piece('wq-d', 'e7')]);
    const { state: next } = applyAction(state, mv('e7', 'e8'), roll(4));
    expect(next.winner).toBe('w');
    expect(() => applyAction(next, mv('e8', 'e7'), noRoll)).toThrow('over');
  });
});

describe('en passant', () => {
  it('takes a pawn that just double-stepped past', () => {
    let state = game([
      piece('wp-e', 'e5'),
      piece('bp-d', 'd7'),
      piece('bp-h', 'h7'),
    ]);
    state = applyAction(state, mv('e1', 'e2'), noRoll).state;
    state = applyAction(state, mv('d7', 'd5'), noRoll).state;
    expect(state.enPassant).toBe('d6');
    const { state: next, events } = applyAction(state, mv('e5', 'd6'), roll(4));
    expect(find(next, 'bp-d')).toBeUndefined();
    expect(find(next, 'wp-e')).toMatchObject({
      square: 'd6',
      trauma: 'unaffected',
    });
    expect(events.map((e) => e.type)).toEqual(['move', 'capture', 'roll']);
  });

  it('is only allowed on the very next move', () => {
    let state = game([
      piece('wp-e', 'e5'),
      piece('bp-d', 'd7'),
      piece('bp-h', 'h7'),
    ]);
    state = applyAction(state, mv('e1', 'e2'), noRoll).state;
    state = applyAction(state, mv('d7', 'd5'), noRoll).state;
    state = applyAction(state, mv('e2', 'e3'), noRoll).state;
    state = applyAction(state, mv('h7', 'h6'), noRoll).state;
    expect(() => applyAction(state, mv('e5', 'd6'), noRoll)).toThrow(
      "can't move there",
    );
  });
});

describe('captures', () => {
  it('rolls on the first capture', () => {
    const state = game([piece('wn-b', 'c3'), piece('bp-d', 'd5')]);
    const die = roll(2);
    const { state: next, events } = applyAction(state, mv('c3', 'd5'), die);
    expect(die).toHaveBeenCalledTimes(1);
    expect(find(next, 'wn-b')?.trauma).toBe('guilt');
    expect(events.map((e) => e.type)).toEqual(['move', 'capture', 'roll']);
  });

  it("doesn't roll again for an active piece", () => {
    const state = game([
      piece('wn-b', 'c3', { trauma: 'unaffected' }),
      piece('bp-d', 'd5'),
    ]);
    expect(
      find(applyAction(state, mv('c3', 'd5'), noRoll).state, 'wn-b')?.trauma,
    ).toBe('unaffected');
  });

  it('re-activates a healed piece without a roll', () => {
    const state = game([
      piece('wn-b', 'c3', { trauma: 'devastated', healed: true, turnsLeft: 1 }),
      piece('bp-d', 'd5'),
    ]);
    const knight = find(
      applyAction(state, mv('c3', 'd5'), noRoll).state,
      'wn-b',
    );
    expect(knight).toMatchObject({
      healed: false,
      turnsLeft: RULES.devastatedTurns,
    });
  });
});

describe('psychopath', () => {
  it('gets one extra move on turning, then the turn passes', () => {
    const state = game([
      piece('wn-b', 'c3'),
      piece('bp-d', 'd5'),
      piece('wp-h', 'h2'),
    ]);
    const first = applyAction(state, mv('c3', 'd5'), roll(6)).state;
    expect(first).toMatchObject({ turn: 'w', extraMovePieceId: 'wn-b' });
    expect(find(first, 'wn-b')?.kills).toBe(1);
    expect(() => applyAction(first, mv('h2', 'h3'), noRoll)).toThrow(
      'psychopath',
    );
    const second = applyAction(first, mv('d5', 'b6'), noRoll).state;
    expect(second).toMatchObject({ turn: 'b', extraMovePieceId: null });
  });

  it('can skip the extra move', () => {
    const state = game([piece('wn-b', 'c3'), piece('bp-d', 'd5')]);
    const first = applyAction(state, mv('c3', 'd5'), roll(6)).state;
    const { state: next, events } = applyAction(
      first,
      { type: 'skipExtraMove' },
      noRoll,
    );
    expect(next).toMatchObject({ turn: 'b', extraMovePieceId: null });
    expect(events.map((e) => e.type)).toEqual(['skipExtraMove']);
    expect(() =>
      applyAction(next, { type: 'skipExtraMove' }, noRoll),
    ).toThrow();
  });

  it('reaches bloodlust on the third capture, with no further extra moves', () => {
    let state = game([
      piece('wn-b', 'c3', { trauma: 'psychopath', kills: 1 }),
      piece('bp-d', 'd5'),
      piece('bp-c', 'c7'),
      piece('bp-h', 'h7'),
    ]);
    state = applyAction(state, mv('c3', 'd5'), noRoll).state;
    expect(state.turn).toBe('b');
    state = applyAction(state, mv('h7', 'h6'), noRoll).state;
    const { state: next, events } = applyAction(state, mv('d5', 'c7'), noRoll);
    expect(find(next, 'wn-b')?.kills).toBe(3);
    expect(events.map((e) => e.type)).toContain('bloodlust');
    expect(next.turn).toBe('b');
  });
});

describe('devastated', () => {
  it('dies after three of its own turns unhealed; the turn it was hit is free', () => {
    let state = game([
      piece('wn-b', 'c3'),
      piece('bp-d', 'd5'),
      piece('bp-h', 'h7'),
    ]);
    state = applyAction(state, mv('c3', 'd5'), roll(1)).state;
    expect(find(state, 'wn-b')?.turnsLeft).toBe(3);

    const blackMoves = [mv('h7', 'h6'), mv('h6', 'h5'), mv('h5', 'h4')];
    const whiteMoves = [mv('e1', 'e2'), mv('e2', 'e3'), mv('e3', 'e4')];
    const left = [];
    for (const [i, blackMove] of blackMoves.entries()) {
      state = applyAction(state, blackMove, noRoll).state;
      const { state: next, events } = applyAction(state, whiteMoves[i], noRoll);
      state = next;
      left.push(
        find(state, 'wn-b')?.turnsLeft ??
          events.find((e) => e.type === 'death')?.type,
      );
    }
    expect(left).toEqual([2, 1, 'death']);
  });

  it("doesn't tick during a psychopath's extra move", () => {
    let state = game([
      piece('wn-b', 'f3', {
        trauma: 'devastated',
        turnsLeft: 2,
        devastatedOnTurn: 0,
      }),
      piece('wr-a', 'a1'),
      piece('bp-a', 'a7'),
    ]);
    state = applyAction(state, mv('a1', 'a7'), roll(6)).state;
    expect(find(state, 'wn-b')?.turnsLeft).toBe(2);
    state = applyAction(state, mv('a7', 'a6'), noRoll).state;
    expect(find(state, 'wn-b')?.turnsLeft).toBe(1);
  });
});

describe('healing', () => {
  it('heals friendly hurt pieces the bishop lands next to', () => {
    const state = game([
      piece('wb-f', 'h1'),
      piece('wn-b', 'e4', { trauma: 'devastated', turnsLeft: 2 }),
      piece('wp-f', 'f4', { trauma: 'guilt' }),
      piece('wp-g', 'g4', { trauma: 'unaffected' }),
      piece('bp-d', 'e3', { trauma: 'guilt' }),
    ]);
    const next = applyAction(state, mv('h1', 'f3'), noRoll).state;
    expect(find(next, 'wn-b')?.healed).toBe(true);
    expect(find(next, 'wp-f')?.healed).toBe(true);
    expect(find(next, 'wp-g')?.healed).toBe(false);
    expect(find(next, 'bp-d')?.healed).toBe(false);
  });

  it("doesn't heal when the hurt piece moves next to the bishop", () => {
    const state = game([
      piece('wb-c', 'd3'),
      piece('wn-b', 'c3', { trauma: 'guilt' }),
    ]);
    expect(
      find(applyAction(state, mv('c3', 'e4'), noRoll).state, 'wn-b')?.healed,
    ).toBe(false);
  });

  it('stops the devastated countdown', () => {
    let state = game([
      piece('wb-c', 'c1'),
      piece('wn-b', 'e4', {
        trauma: 'devastated',
        turnsLeft: 1,
        devastatedOnTurn: 0,
      }),
    ]);
    state = applyAction(state, mv('c1', 'f4'), noRoll).state;
    expect(find(state, 'wn-b')).toMatchObject({ healed: true, turnsLeft: 1 });
  });

  it('lets a bishop heal itself, using the turn', () => {
    const state = game([piece('wb-c', 'c1', { trauma: 'guilt' })]);
    const next = applyAction(
      state,
      { type: 'selfHeal', pieceId: 'wb-c' },
      noRoll,
    ).state;
    expect(find(next, 'wb-c')?.healed).toBe(true);
    expect(next.turn).toBe('b');
  });

  it("won't self-heal a psychopath, an enemy, or a non-bishop", () => {
    const state = game([
      piece('wb-c', 'c1', { trauma: 'psychopath', kills: 1 }),
      piece('wn-b', 'b1', { trauma: 'guilt' }),
      piece('bb-c', 'c8', { trauma: 'guilt' }),
    ]);
    for (const pieceId of ['wb-c', 'wn-b', 'bb-c']) {
      expect(() =>
        applyAction(state, { type: 'selfHeal', pieceId }, noRoll),
      ).toThrow();
    }
  });
});

describe('movement', () => {
  it('follows how each piece moves', () => {
    const state = initialState();
    expect(legalMoves(state, 'e2').sort()).toEqual(['e3', 'e4']);
    expect(legalMoves(state, 'b1').sort()).toEqual(['a3', 'c3']);
    expect(legalMoves(state, 'a1')).toEqual([]);
    expect(() => applyAction(state, mv('e2', 'e5'), noRoll)).toThrow(
      "can't move there",
    );
  });

  it("won't move into check", () => {
    const state = game([piece('br-d', 'd8')]);
    expect(() => applyAction(state, mv('e1', 'd1'), noRoll)).toThrow();
    expect(legalMoves(state, 'e1')).toContain('f1');
  });

  it('ignores checks from hurt pieces', () => {
    for (const trauma of ['guilt', 'devastated'] as const) {
      const state = game([piece('br-d', 'd8', { trauma, turnsLeft: 2 })]);
      expect(legalMoves(state, 'e1')).toContain('d1');
    }
  });
});

describe('hurt pieces', () => {
  it("can't capture until healed", () => {
    for (const trauma of ['guilt', 'devastated'] as const) {
      const hurt = game([
        piece('wr-a', 'a1', { trauma, turnsLeft: 2 }),
        piece('bp-a', 'a5'),
      ]);
      expect(legalMoves(hurt, 'a1')).toContain('a4');
      expect(legalMoves(hurt, 'a1')).not.toContain('a5');
      const healed = game([
        piece('wr-a', 'a1', { trauma, turnsLeft: 2, healed: true }),
        piece('bp-a', 'a5'),
      ]);
      expect(legalMoves(healed, 'a1')).toContain('a5');
    }
  });
});

describe('castling', () => {
  it('needs an unmoved king and rook', () => {
    expect(
      legalMoves(game([piece('wr-h', 'h1', { moved: true })]), 'e1'),
    ).not.toContain('g1');
    const state = applyAction(
      game([piece('wr-h', 'h1'), piece('bp-a', 'a7')]),
      mv('e1', 'f1'),
      noRoll,
    ).state;
    const back = applyAction(state, mv('a7', 'a6'), noRoll).state;
    const home = applyAction(back, mv('f1', 'e1'), noRoll).state;
    const again = applyAction(home, mv('a6', 'a5'), noRoll).state;
    expect(legalMoves(again, 'e1')).not.toContain('g1');
  });

  it("can't castle out of or through check, unless the attacker is hurt", () => {
    const through = game([piece('wr-h', 'h1'), piece('br-f', 'f8')]);
    expect(legalMoves(through, 'e1')).not.toContain('g1');
    const out = game([piece('wr-h', 'h1'), piece('br-e', 'e5')]);
    expect(legalMoves(out, 'e1')).not.toContain('g1');
    const hurt = game([
      piece('wr-h', 'h1'),
      piece('br-f', 'f8', { trauma: 'guilt' }),
    ]);
    expect(legalMoves(hurt, 'e1')).toContain('g1');
  });
});

describe('checkmate', () => {
  it('ends the game when the side to move is mated', () => {
    const { state, events } = applyAction(backRank(), mv('a1', 'a8'), noRoll);
    expect(state.winner).toBe('w');
    expect(events.at(-1)).toEqual({
      type: 'gameOver',
      winner: 'w',
      reason: 'checkmate',
    });
  });

  it("doesn't count squares guarded by a hurt piece", () => {
    const { state, events } = applyAction(
      backRank({ trauma: 'guilt' }),
      mv('a1', 'a8'),
      noRoll,
    );
    expect(state.winner).toBeNull();
    expect(events.at(-1)).toEqual({ type: 'check', color: 'b' });
    expect(legalMoves(state, 'h8')).toEqual(['h7']);
  });

  it("ends at once when a psychopath's first capture mates", () => {
    const start = backRank();
    start.pieces.push(piece('bn-b', 'a8'));
    const { state } = applyAction(start, mv('a1', 'a8'), roll(6));
    expect(state).toMatchObject({ winner: 'w', extraMovePieceId: null });
  });

  it('draws by stalemate', () => {
    const state = board([
      piece('wk', 'e1'),
      piece('bk', 'a8'),
      piece('wq-d', 'c5'),
    ]);
    const { state: next, events } = applyAction(state, mv('c5', 'b6'), noRoll);
    expect(next.winner).toBe('draw');
    expect(events.at(-1)).toMatchObject({ reason: 'stalemate' });
  });

  it("won't let a bishop heal itself while in check", () => {
    const state = game([
      piece('wb-c', 'c1', { trauma: 'guilt' }),
      piece('br-e', 'e5'),
    ]);
    expect(() =>
      applyAction(state, { type: 'selfHeal', pieceId: 'wb-c' }, noRoll),
    ).toThrow('check');
  });
});

describe('bloodlust', () => {
  const lust = { trauma: 'psychopath' as const, kills: RULES.bloodlustKills };

  it('only moves to capture, and may capture its own side', () => {
    const state = game([
      piece('wn-b', 'c3', lust),
      piece('wp-d', 'd5'),
      piece('bp-b', 'b5'),
    ]);
    expect(legalMoves(state, 'c3').sort()).toEqual(['b5', 'd5']);
  });

  it('loses the game by taking its own king', () => {
    const state = game([piece('wn-b', 'd3', lust)]);
    expect(applyAction(state, mv('d3', 'e1'), noRoll).state.winner).toBe('b');
  });
});
