import type { Color, GameState, Piece, PieceType } from '@/types/remorse';

// The scripted tutorial game: the player is White, every roll is fixed and
// Black's replies are set, so it plays out the same way every time.

const piece = (color: Color, type: PieceType, square: string): Piece => ({
  id: `${color}${type}-${square}`,
  color,
  type,
  square,
  trauma: null,
  healed: false,
  turnsLeft: 0,
  devastatedOnTurn: null,
  kills: 0,
  moved: true,
});

export const tutorialStart = (): GameState => ({
  pieces: [
    piece('w', 'k', 'e1'),
    piece('w', 'q', 'd1'),
    piece('w', 'b', 'c1'),
    piece('w', 'n', 'f3'),
    piece('w', 'p', 'c3'),
    piece('w', 'p', 'f2'),
    piece('w', 'p', 'g2'),
    piece('w', 'p', 'h2'),
    piece('b', 'k', 'g8'),
    piece('b', 'n', 'h6'),
    piece('b', 'b', 'c8'),
    piece('b', 'b', 'b4'),
    piece('b', 'p', 'a7'),
    piece('b', 'p', 'c7'),
    piece('b', 'p', 'd6'),
    piece('b', 'p', 'e5'),
    piece('b', 'p', 'f7'),
    piece('b', 'p', 'g7'),
  ],
  turn: 'w',
  extraMovePieceId: null,
  turnNumber: 1,
  winner: null,
  enPassant: null,
});

export interface ScriptMove {
  from: string;
  to: string;
  // the die, when this is the piece's first capture
  roll?: number;
}

// note: text to read, then Continue. you: the one move the player may make,
// or `heal`: the square of the bishop that must heal. them: Black's
// reply, played on its own.
export type Beat =
  | { kind: 'note'; title: string; text: string }
  | ({ kind: 'you'; text: string } & (ScriptMove | { heal: string }))
  | ({ kind: 'them' } & ScriptMove);

export const TUTORIAL: Beat[] = [
  {
    kind: 'note',
    title: 'Welcome to Remorse Chess',
    text: "It's chess, but pieces feel bad about capturing. You're White. Follow the highlighted moves.",
  },
  {
    kind: 'you',
    from: 'f3',
    to: 'e5',
    roll: 1,
    text: "A piece's first capture rolls a die, and the roll decides its trauma for the rest of the game. Take the pawn with your knight.",
  },
  {
    kind: 'note',
    title: 'Rolled 1: devastated',
    text: "Your knight can't capture, give check or guard a square. Its marker counts down: after 3 of your turns it dies of grief, unless a bishop heals it.",
  },
  { kind: 'them', from: 'b4', to: 'c3', roll: 1 },
  {
    kind: 'note',
    title: 'Their bishop rolled 1: devastated',
    text: "It's lined up with your king, but that's not check: devastated and guilt-ridden pieces can't threaten a king. Black has 3 turns to heal it. Keep an eye on its marker.",
  },
  {
    kind: 'you',
    from: 'c1',
    to: 'f4',
    text: 'A bishop that moves next to a hurt piece of its own color heals it. Bring your bishop next to the knight.',
  },
  {
    kind: 'note',
    title: 'Healed',
    text: 'The knight plays normally again. If it ever captures again, its trauma comes back.',
  },
  { kind: 'them', from: 'a7', to: 'a6' },
  {
    kind: 'you',
    from: 'f4',
    to: 'h6',
    roll: 3,
    text: 'Bishops have feelings too. Take the knight on h6.',
  },
  {
    kind: 'note',
    title: 'Rolled 3: guilt-ridden',
    text: "Rolls of 2 or 3. Your bishop can't capture, give check or guard a square until it's healed, but guilt never kills.",
  },
  { kind: 'them', from: 'a6', to: 'a5' },
  {
    kind: 'you',
    heal: 'h6',
    text: 'A bishop can heal itself and the hurt pieces next to it, but it uses your turn. Tap the marker on your bishop.',
  },
  { kind: 'them', from: 'a5', to: 'a4' },
  {
    kind: 'note',
    title: 'Died of grief',
    text: 'Black never healed its bishop, so after 3 of its turns it died.',
  },
  {
    kind: 'you',
    from: 'd1',
    to: 'd6',
    roll: 6,
    text: 'Rolls of 4 or 5 leave a piece unaffected. A 6 is the one to hope for. Take the pawn on d6 with your queen.',
  },
  {
    kind: 'you',
    from: 'd6',
    to: 'c7',
    text: 'Rolled 6: your queen is a psychopath. Every capture earns it an optional extra move. Use it: take the pawn on c7.',
  },
  { kind: 'them', from: 'a4', to: 'a3' },
  {
    kind: 'you',
    from: 'c7',
    to: 'c8',
    text: 'The ring around its marker counts captures. Take the bishop for the third one.',
  },
  {
    kind: 'you',
    from: 'c8',
    to: 'g8',
    text: "Bloodlust: after 3 captures a psychopath can only move to capture, and it'll take pieces of either color. Its extra move is a capture too. Take the king: that ends the game, whoever's king it is.",
  },
  {
    kind: 'note',
    title: 'King captured',
    text: "That's everything. The rest is regular chess: castling, en passant, promotion, check and stalemate.",
  },
];
