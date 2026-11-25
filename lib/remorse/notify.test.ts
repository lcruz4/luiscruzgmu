import { initialState } from './engine';
import { pushMessage } from './notify';
import type {
  GameEvent,
  GameResponse,
  GameStep,
  Piece,
  PieceRef,
} from '@/types/remorse';

const ref = (id: string, type: PieceRef['type'], color: 'w' | 'b' = 'w') => ({
  id,
  type,
  color,
});
const knight = ref('wn-g', 'n');
const queen = ref('bq-d', 'q', 'b');
const rook = ref('br-a', 'r', 'b');

const step = (color: 'w' | 'b', events: GameEvent[]): GameStep => ({
  step: 0,
  color,
  events,
  createdAt: '',
});

// White (the actor) just played `steps`; black is to move
const game = (
  steps: GameStep[],
  knightState: Partial<Piece> | null = {},
  winner: GameResponse['state']['winner'] = null,
): GameResponse => {
  const state = initialState();
  const pieces = state.pieces.filter((p) => p.id !== knight.id);
  if (knightState) {
    const base = state.pieces.find((p) => p.id === knight.id);
    if (base) pieces.push({ ...base, ...knightState });
  }
  return {
    id: 1,
    mode: 'online',
    whiteEmail: 'w@x',
    blackEmail: 'b@x',
    whiteId: 1,
    blackId: 2,
    whiteName: 'kayz',
    blackName: 'luis',
    whiteIcon: null,
    blackIcon: null,
    whiteRating: 1200,
    blackRating: 1200,
    whiteRatingChange: null,
    blackRatingChange: null,
    state: { ...state, pieces, turn: 'b', winner },
    version: 1,
    steps: [
      step('b', [{ type: 'move', piece: rook, from: 'a8', to: 'a7' }]),
      ...steps,
    ],
    you: ['b'],
    rematchId: null,
    inviteToken: null,
    matchmaking: false,
    challenge: null,
  };
};

const capture = (captured: PieceRef): GameEvent => ({
  type: 'capture',
  piece: knight,
  captured,
});

const body = (g: GameResponse) => pushMessage(g, 'b', 'kayz', 'other')?.body;

describe('pushMessage', () => {
  it.each([
    ['devastated', '... but they feel terrible about it 😢'],
    ['guilt', '... but they feel bad about it 😔'],
    ['unaffected', '... and they felt nothing 😐'],
    ['psychopath', '... and they liked it 😈'],
  ] as const)('a %s capture', (trauma, ending) => {
    expect(body(game([step('w', [capture(queen)])], { trauma }))).toBe(
      `Their knight took your queen${ending}`,
    );
  });

  it('a psychopath taking two with its extra move', () => {
    const g = game([step('w', [capture(queen)]), step('w', [capture(rook)])], {
      trauma: 'psychopath',
      kills: 2,
    });
    expect(body(g)).toBe(
      'Their knight took your queen and rook... and they liked it 😈',
    );
  });

  it('bloodlust', () => {
    const g = game(
      [step('w', [capture(queen), { type: 'bloodlust', piece: knight }])],
      { trauma: 'psychopath', kills: 3 },
    );
    expect(body(g)).toBe(
      "Their knight took your queen... and they'll do it again 🩸",
    );
  });

  it('a capturer that has since died uses its roll', () => {
    const g = game(
      [
        step('w', [
          capture(queen),
          { type: 'roll', piece: knight, roll: 1, trauma: 'devastated' },
        ]),
      ],
      null,
    );
    expect(body(g)).toBe(
      'Their knight took your queen... but they feel terrible about it 😢',
    );
  });

  it('a plain move', () => {
    const g = game([
      step('w', [{ type: 'move', piece: knight, from: 'g1', to: 'f3' }]),
    ]);
    expect(pushMessage(g, 'b', 'kayz', 'other')).toEqual({
      title: 'Your move vs kayz',
      body: 'Their knight moved to f3.',
    });
  });

  it('nothing while it is still the actor’s move', () => {
    const g = game([step('w', [capture(queen)])], { trauma: 'psychopath' });
    g.state.turn = 'w';
    expect(pushMessage(g, 'b', 'kayz', 'other')).toBeNull();
  });

  it('a king taken ends the game, mood or not', () => {
    const g = game(
      [
        step('w', [capture(rook), { type: 'bloodlust', piece: knight }]),
        step('w', [
          capture(ref('bk-e', 'k', 'b')),
          { type: 'gameOver', winner: 'w', reason: 'king' },
        ]),
      ],
      { trauma: 'psychopath', kills: 3 },
      'w',
    );
    expect(pushMessage(g, 'b', 'kayz', 'other')).toEqual({
      title: 'You lost vs kayz',
      body: 'Their knight took your rook and king. Game over.',
    });
  });

  it.each([
    ['checkmate', 'Checkmate. Game over.'],
    ['stalemate', 'Stalemate. Game over.'],
    ['resign', 'kayz resigned.'],
  ] as const)('a %s', (reason, text) => {
    const g = game(
      [step('w', [{ type: 'gameOver', winner: 'w', reason }])],
      {},
      'w',
    );
    expect(pushMessage(g, 'b', 'kayz', 'other')?.body).toBe(text);
  });

  it('join', () => {
    expect(pushMessage(game([]), 'b', 'kayz', 'join')?.body).toBe(
      'kayz joined your game.',
    );
  });
});
